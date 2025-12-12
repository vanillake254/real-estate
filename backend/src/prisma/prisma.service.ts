import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({});
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Shutdown hooks are automatically handled by NestJS
    // this.$on('beforeExit', async () => {
    //   await app.close();
    // });
  }

  private async connectWithRetry() {
    const maxRetries = 10;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await this.$connect();
        return;
      } catch (e) {
        attempt += 1;
        const delay = Math.min(5000, 500 * attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
