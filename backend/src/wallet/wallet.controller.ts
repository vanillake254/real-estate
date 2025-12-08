import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async get(@Req() req: any) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: req.user.userId } });
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet?.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { wallet, transactions };
  }
}

