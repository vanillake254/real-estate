import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private payouts: PayoutsService) {}

  @Post()
  request(@Req() req: any, @Body() dto: CreatePayoutDto) {
    return this.payouts.request(req.user.userId, dto.amount, dto.phoneNumber);
  }

  @Get()
  mine(@Req() req: any) {
    return this.payouts.listMine(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get('admin/all')
  adminAll() {
    return this.payouts.adminList();
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post('admin/:id/approve')
  approve(@Req() req: any, @Param('id') id: string) {
    return this.payouts.approve(id, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post('admin/:id/reject')
  reject(@Req() req: any, @Param('id') id: string) {
    return this.payouts.reject(id, req.user.userId);
  }
}
