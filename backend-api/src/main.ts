import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`) });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global Validation Pipe
  // This automatically uses your DTO classes to block bad data (e.g., if someone sends a string instead of a number for the year)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any extra fields not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if extra fields are sent
      transform: true, // Automatically transforms payloads to match DTO classes
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Accept'],
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 API is running on ${process.env.BACKEND_API_URL}`);
}
bootstrap();
