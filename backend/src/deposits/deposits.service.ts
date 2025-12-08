import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, DepositStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService, private walletService: WalletService) {}

  async create(userId: string, amount: number, phoneNumber: string, message: string) {
    return this.prisma.deposit.create({
      data: {
        userId,
        amount,
        phoneNumber,
        message,
      },
    });
  }

  async listMine(userId: string) {
    return this.prisma.deposit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async adminList() {
    return this.prisma.deposit.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true } });
  }

  async approve(depositId: string, adminId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.status !== DepositStatus.PENDING) throw new BadRequestException('Invalid deposit');
    await this.prisma.deposit.update({
      where: { id: depositId },
      data: { status: DepositStatus.APPROVED, approvedAt: new Date(), approvedById: adminId },
    });
    await this.walletService.creditInvestable(
      deposit.userId,
      new Prisma.Decimal(deposit.amount),
      { depositId },
    );
    return true;
  }

  async reject(depositId: string, adminId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.status !== DepositStatus.PENDING) throw new BadRequestException('Invalid deposit');
    return this.prisma.deposit.update({
      where: { id: depositId },
      data: { status: DepositStatus.REJECTED, approvedAt: new Date(), approvedById: adminId },
    });
  }
}

