/**
 * Kodem Worker — runs engines asynchronously on events.
 */

import { configureDatabaseEnv } from '@kodem/database';

configureDatabaseEnv(__dirname);

async function bootstrap() {
  const [{ Logger }, { NestFactory }, { AppModule }] = await Promise.all([
    import('@nestjs/common'),
    import('@nestjs/core'),
    import('./app/app.module'),
  ]);

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'worker';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.WORKER_PORT || 3334;
  await app.listen(port);
  Logger.log(
    `Kodem Worker running at http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
