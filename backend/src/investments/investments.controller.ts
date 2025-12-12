import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { StartEarningDto } from './dto/start-earning.dto';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investments: InvestmentsService) {}

  @Get('packages')
  listPackages() {
    return this.investments.listPackages();
  }

  @Get()
  list(@Req() req: any) {
    return this.investments.listInvestments(req.user.userId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateInvestmentDto) {
    return this.investments.createInvestment(req.user.userId, dto.packageId);
  }

  @Post('start')
  start(@Req() req: any, @Body() dto: StartEarningDto) {
    return this.investments.startEarning(req.user.userId, dto.earningId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get('admin/all')
  adminAll() {
    return this.investments.adminListInvestments();
  }
}
