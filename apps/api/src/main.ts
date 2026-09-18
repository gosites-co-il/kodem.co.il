/**
 * Kodem API — orchestrates business logic and emits events.
 */

import { configureDatabaseEnv } from '@kodem/database';

configureDatabaseEnv(__dirname);

async function bootstrap() {
  const { Logger } = await import('@nestjs/common');
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app/app.module');

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
  const marketingUrl =
    process.env['MARKETING_URL'] ?? process.env['PUBLIC_SITE_URL'] ?? 'http://localhost:4321';
  const extraOrigins = (process.env['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [
      appUrl,
      marketingUrl,
      'http://localhost:3000',
      'http://localhost:4321',
      ...extraOrigins,
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(`Kodem API running at http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
