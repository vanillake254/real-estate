import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma, TransactionDirection, WalletTransactionType } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, role: true },
    });

    if (!user) return null;

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referredUser: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalReferral = referrals.reduce(
      (sum, r) => sum.add(r.rewardAmount),
      new Prisma.Decimal(0),
    );

    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return {
      user: safeUser,
      referrals,
      referralEarnings: totalReferral.toString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const data: any = {};

    // Handle username update
    if (dto.username && dto.username !== user.username) {
      data.username = dto.username;
    }

    // Handle phone number update
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      // Check if phone number is already taken
      const existingPhone = await this.prisma.user.findFirst({
        where: { phoneNumber: dto.phoneNumber, id: { not: userId } },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already in use');
      }
      data.phoneNumber = dto.phoneNumber;
    }

    // Handle password change
    if (dto.newPassword) {
      // Current password is required when changing password
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash and set new password
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
      data.mustChangePassword = false;
    }

    // If no changes, return current user data
    if (!Object.keys(data).length) {
      return this.me(userId);
    }

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.me(userId);
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      include: { wallet: true, role: true },
      orderBy: { createdAt: 'desc' },
    });

    // Remove sensitive fields
    return users.map(({ passwordHash, refreshTokenHash, ...user }) => user);
  }

  async adjustBalances(userId: string, deltaAvailable: number, deltaInvestable: number, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');

      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          available: { increment: deltaAvailable },
          investable: { increment: deltaInvestable },
        },
      });

      await tx.walletTransaction.createMany({
        data: [
          ...(deltaAvailable !== 0
            ? [
                {
                  walletId: wallet.id,
                  type: WalletTransactionType.ADJUSTMENT,
                  direction: deltaAvailable > 0 ? TransactionDirection.CREDIT : TransactionDirection.DEBIT,
                  amount: Math.abs(deltaAvailable),
                  balanceAfter: updated.available,
                  metadata: { adminId, reason: 'manual_adjust_available' },
                },
              ]
            : []),
          ...(deltaInvestable !== 0
            ? [
                {
                  walletId: wallet.id,
                  type: WalletTransactionType.ADJUSTMENT,
                  direction: deltaInvestable > 0 ? TransactionDirection.CREDIT : TransactionDirection.DEBIT,
                  amount: Math.abs(deltaInvestable),
                  balanceAfter: updated.investable,
                  metadata: { adminId, reason: 'manual_adjust_investable' },
                },
              ]
            : []),
        ],
      });

      return updated;
    });
  }

  async resetPasswordToDefault(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const passwordHash = await bcrypt.hash('00000000', 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordResetRequestedAt: null,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: 'RESET_PASSWORD_DEFAULT',
        entity: 'User',
        entityId: userId,
        metadata: { reason: 'forgot_password_request' },
      },
    });

    return true;
  }
}
