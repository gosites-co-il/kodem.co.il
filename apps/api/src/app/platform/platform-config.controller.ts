import { Controller, Get } from '@nestjs/common';
import { listPlans } from '@kodem/platform/subscription';

@Controller('platform')
export class PlatformConfigController {
  @Get('config')
  config() {
    const env =
      process.env['FEATURE_FLAG_ENV'] ?? process.env['NODE_ENV'] ?? 'development';
    return {
      appUrl: process.env['APP_URL'] ?? 'http://localhost:3000',
      environment: env,
      plans: listPlans().map((p) => ({
        id: p.id,
        name: p.name,
        monthlyPrice: p.monthlyPrice,
      })),
      flags: {
        billingConfigured: false,
      },
    };
  }
}
