/**
 * Kodem API — orchestrates business logic and emits events.
 */

import { config } from 'dotenv';
import { join } from 'path';

config();
process.env.DATABASE_URL ??=
  `file:${join(process.cwd(), 'libs/database/prisma/kodem.db')}`;

async function bootstrap() {
  const { Logger } = await import('@nestjs/common');
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app/app.module');

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(`Kodem API running at http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
