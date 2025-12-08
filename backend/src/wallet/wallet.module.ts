import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletController } from './wallet.controller';

@Module({
  imports: [PrismaModule],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}

