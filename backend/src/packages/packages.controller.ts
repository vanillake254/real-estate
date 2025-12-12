import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageDto } from './dto/package.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { RoleName } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
@Controller('packages')
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @Get()
  list() {
    return this.packagesService.list();
  }

  @Post()
  create(@Body() dto: PackageDto) {
    return this.packagesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: PackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packagesService.delete(id);
  }
}
