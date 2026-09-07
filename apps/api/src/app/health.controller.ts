import { Controller, Get } from '@nestjs/common';
import { getPrismaClient } from '@kodem/database';

@Controller()
export class HealthController {
  @Get('health')
  async health() {
    let db: 'ok' | 'error' | 'skipped' = 'skipped';
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'error';
    }

    return {
      status: db === 'error' ? 'degraded' : 'ok',
      service: 'kodem-api',
      readiness: { db },
    };
  }
}
