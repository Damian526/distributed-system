import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
});
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const logger = new Logger('Bootstrap');

  // Stripe wants the raw body, everyone else wants normal JSON
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/webhooks') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });

  // Checks every request body against its DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop fields the DTO doesn't expect
      forbidNonWhitelisted: true, // reject if extra fields show up
      transform: true, // turn plain JSON into DTO instances
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
