import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentProcessor } from './processors/payment.processor';
import { ReportProcessor } from './processors/report.processor';

@Module({
  imports: [
    // 1. Tell the worker where the Redis waiting room is located.
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'report-queue' },
      { name: 'webhook-queue' },
    ),
    PrismaModule,
  ],
  providers: [ReportProcessor, PaymentProcessor], // We will create this next
})
export class AppModule {}
