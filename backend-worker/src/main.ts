import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');

  // no need for an HTTP server here, this app only listens to queues
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('👷 Background Worker is alive and listening to Redis queues...');
}
bootstrap();
