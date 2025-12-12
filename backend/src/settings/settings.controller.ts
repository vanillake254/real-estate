import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  list() {
    return this.settings.list();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settings.get(key);
  }

  @Post(':key')
  set(
    @Param('key') key: string,
    @Body() body: { value: string; description?: string },
  ) {
    return this.settings.set(key, body.value, body.description);
  }
}
