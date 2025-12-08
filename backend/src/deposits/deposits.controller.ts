import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private deposits: DepositsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDepositDto) {
    return this.deposits.create(req.user.userId, dto.amount, dto.phoneNumber, dto.message);
  }

  @Get()
  mine(@Req() req: any) {
    return this.deposits.listMine(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get('admin/all')
  adminAll() {
    return this.deposits.adminList();
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post('admin/:id/approve')
  approve(@Req() req: any, @Param('id') id: string) {
    return this.deposits.approve(id, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post('admin/:id/reject')
  reject(@Req() req: any, @Param('id') id: string) {
    return this.deposits.reject(id, req.user.userId);
  }
}

