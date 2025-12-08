import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PayoutStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService, private walletService: WalletService) {}

  async request(userId: string, amount: number, phoneNumber: string) {
    const allowed = [100, 150, 200, 250, 300, 350];
    if (!allowed.includes(amount)) {
      throw new BadRequestException('Invalid withdrawal amount. Allowed amounts are 100, 150, 200, 250, 300, 350.');
    }
    await this.walletService.debitAvailable(userId, new Prisma.Decimal(amount), WalletTransactionType.WITHDRAWAL_REQUEST, {
      phoneNumber,
    });
    return this.prisma.payout.create({
      data: {
        userId,
        amount,
        phoneNumber,
      },
    });
  }

  async listMine(userId: string) {
    return this.prisma.payout.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async adminList() {
    return this.prisma.payout.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  }

  async approve(payoutId: string, adminId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== PayoutStatus.PENDING) throw new BadRequestException('Invalid payout');
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.APPROVED, approvedAt: new Date(), approvedById: adminId },
    });
  }

  async reject(payoutId: string, adminId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== PayoutStatus.PENDING) throw new BadRequestException('Invalid payout');
    // return funds
    await this.walletService.creditAvailable(
      payout.userId,
      new Prisma.Decimal(payout.amount),
      WalletTransactionType.ADJUSTMENT,
      { reason: 'withdrawal_rejected', payoutId },
    );
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.REJECTED, approvedAt: new Date(), approvedById: adminId },
    });
  }
}

