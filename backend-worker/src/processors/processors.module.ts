import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentProcessor } from './payment.processor';
import { ReportProcessor } from './report.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'report-queue' }),
    BullModule.registerQueue({ name: 'webhook-queue' }),
  ],
  providers: [PaymentProcessor, ReportProcessor],
})
export class ProcessorsModule {}
