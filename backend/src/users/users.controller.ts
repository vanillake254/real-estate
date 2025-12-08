import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.users.me(req.user.userId);
  }

  @Patch('me')
  update(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  list() {
    return this.users.listUsers();
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(':id/adjust')
  adjust(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { deltaAvailable?: number; deltaInvestable?: number },
  ) {
    return this.users.adjustBalances(id, body.deltaAvailable ?? 0, body.deltaInvestable ?? 0, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post(':id/reset-password')
  resetPassword(@Req() req: any, @Param('id') id: string) {
    return this.users.resetPasswordToDefault(id, req.user.userId);
  }
}

