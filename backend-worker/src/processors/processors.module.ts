import { Module } from '@nestjs/common';
import { PaymentProcessor } from './payment.processor';
import { ReportProcessor } from './report.processor';

@Module({
  providers: [PaymentProcessor, ReportProcessor],
})
export class ProcessorsModule {}
