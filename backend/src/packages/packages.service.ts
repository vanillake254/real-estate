import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.investmentPackage.findMany({
      orderBy: { price: 'asc' },
    });
  }

  create(dto: PackageDto) {
    return this.prisma.investmentPackage.create({
      data: dto,
    });
  }

  update(id: string, dto: PackageDto) {
    return this.prisma.investmentPackage.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: string) {
    return this.prisma.investmentPackage.delete({ where: { id } });
  }
}
