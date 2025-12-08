import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  async set(key: string, value: string, description?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  list() {
    return this.prisma.setting.findMany();
  }
}

