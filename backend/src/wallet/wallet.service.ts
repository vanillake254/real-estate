import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, WalletTransactionType, TransactionDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async creditAvailable(userId: string, amount: Prisma.Decimal, type: WalletTransactionType, metadata?: any) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: {
          available: { increment: amount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          direction: TransactionDirection.CREDIT,
          amount,
          balanceAfter: wallet.available,
          metadata,
        },
      });
      return wallet;
    });
  }

  async debitAvailable(userId: string, amount: Prisma.Decimal, type: WalletTransactionType, metadata?: any) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.available < amount) throw new BadRequestException('Insufficient withdrawable balance');
      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          available: { decrement: amount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          direction: TransactionDirection.DEBIT,
          amount,
          balanceAfter: updated.available,
          metadata,
        },
      });
      return updated;
    });
  }

  async creditInvestable(userId: string, amount: Prisma.Decimal, metadata?: any) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: {
          investable: { increment: amount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEPOSIT_APPROVED,
          direction: TransactionDirection.CREDIT,
          amount,
          balanceAfter: wallet.available,
          metadata,
        },
      });
      return wallet;
    });
  }

  async lockPrincipal(userId: string, amount: Prisma.Decimal) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.investable < amount) throw new BadRequestException('Insufficient investable balance');
      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          investable: { decrement: amount },
          lockedPrincipal: { increment: amount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.INVESTMENT_LOCK,
          direction: TransactionDirection.DEBIT,
          amount,
          balanceAfter: updated.available,
        },
      });
      return updated;
    });
  }

  async unlockPrincipal(userId: string, amount: Prisma.Decimal) {
    return this.prisma.wallet.update({
      where: { userId },
      data: {
        lockedPrincipal: { decrement: amount },
      },
    });
  }
}

