import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');

  // 1. 'createApplicationContext' boots up NestJS WITHOUT starting an HTTP server (no port 3000).
  // This saves RAM and is the best practice for background processors.
  const app = await NestFactory.createApplicationContext(AppModule);

  // 2. The app will now stay alive in the background, listening to Redis.
  logger.log('👷 Background Worker is alive and listening to Redis queues...');
}
bootstrap();
