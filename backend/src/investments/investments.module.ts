import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule, ScheduleModule.forRoot()],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
