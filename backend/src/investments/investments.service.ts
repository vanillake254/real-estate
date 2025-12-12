import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  EarningStatus,
  InvestmentStatus,
  RoleName,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InvestmentsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async listPackages() {
    return this.prisma.investmentPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async createInvestment(userId: string, packageId: string) {
    const pkg = await this.prisma.investmentPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg || !pkg.isActive)
      throw new BadRequestException('Package unavailable');

    // lock principal
    await this.walletService.lockPrincipal(userId, pkg.price);

    const investment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.investment.create({
        data: {
          userId,
          packageId: pkg.id,
          principal: pkg.price,
          dailyReturn: pkg.dailyReturn,
          status: InvestmentStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(
            Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000,
          ),
          lockedAt: new Date(),
        },
      });

      const earnings: Prisma.EarningCreateManyInput[] = [];
      for (let i = 0; i < pkg.durationDays; i++) {
        earnings.push({
          investmentId: created.id,
          dayIndex: i + 1,
          amount: pkg.dailyReturn,
          status: EarningStatus.PENDING,
        });
      }
      await tx.earning.createMany({ data: earnings });
      return created;
    });

    // Referral bonus 10% credited as withdrawable
    const ref = await this.prisma.referral.findFirst({
      where: { referredUserId: userId },
      include: { referrer: true },
    });
    if (ref?.referrerId) {
      const reward = new Prisma.Decimal(pkg.price).mul(
        new Prisma.Decimal('0.10'),
      );
      await this.walletService.creditAvailable(
        ref.referrerId,
        reward,
        WalletTransactionType.REFERRAL_BONUS,
        {
          fromUserId: userId,
          investmentId: investment.id,
        },
      );
      await this.prisma.referral.update({
        where: { id: ref.id },
        data: { investmentId: investment.id, rewardAmount: reward },
      });
    }

    return investment;
  }

  async startEarning(userId: string, earningId: string) {
    const earning = await this.prisma.earning.findUnique({
      where: { id: earningId },
      include: { investment: true },
    });
    if (!earning || earning.investment.userId !== userId)
      throw new BadRequestException('Not found');
    if (earning.status !== EarningStatus.PENDING)
      throw new BadRequestException('Already started');

    // Ensure only one active accrual per investment at a time
    const existingActive = await this.prisma.earning.findFirst({
      where: {
        investmentId: earning.investmentId,
        status: EarningStatus.STARTED,
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'You already have an earning in progress for this investment. Please wait for it to complete before starting another day.',
      );
    }

    return this.prisma.earning.update({
      where: { id: earningId },
      data: { status: EarningStatus.STARTED, startedAt: new Date() },
    });
  }

  async creditDueEarnings() {
    const cutoff = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const earnings = await this.prisma.earning.findMany({
      where: { status: EarningStatus.STARTED, startedAt: { lte: cutoff } },
    });
    for (const earning of earnings) {
      await this.prisma.$transaction(async (tx) => {
        await tx.earning.update({
          where: { id: earning.id },
          data: {
            status: EarningStatus.CREDITED,
            creditedAt: new Date(),
            completedAt: new Date(),
          },
        });
        await tx.investment.update({
          where: { id: earning.investmentId },
          data: {
            totalEarned: { increment: earning.amount },
          },
        });
      });
      await this.walletService.creditAvailable(
        (await this.prisma.investment.findUnique({
          where: { id: earning.investmentId },
        }))!.userId,
        earning.amount,
        WalletTransactionType.EARNING_CREDIT,
        { earningId: earning.id },
      );
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cronCredit() {
    await this.creditDueEarnings();
  }

  async listInvestments(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      include: { earnings: true, package: true },
    });
  }

  async adminListInvestments() {
    return this.prisma.investment.findMany({
      include: { user: true, package: true },
    });
  }
}
