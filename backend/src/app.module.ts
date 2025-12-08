import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { InvestmentsModule } from './investments/investments.module';
import { DepositsModule } from './deposits/deposits.module';
import { PayoutsModule } from './payouts/payouts.module';
import { UsersModule } from './users/users.module';
import { PackagesModule } from './packages/packages.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WalletModule,
    InvestmentsModule,
    DepositsModule,
    PayoutsModule,
    UsersModule,
    PackagesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
