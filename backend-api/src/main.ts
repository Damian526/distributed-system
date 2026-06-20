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

  app.enableCors();
  await app.listen(3000);
  logger.log('🚀 API is running on http://localhost:3000');
}
bootstrap();
