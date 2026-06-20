import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

// 1. @Processor tells BullMQ: "This class handles all jobs placed in 'webhook-queue'"
@Processor('webhook-queue')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  // 2. The process() method is automatically triggered the millisecond a job arrives in Redis.
  async process(job: Job<any, any, string>): Promise<void> {
    this.logger.log(`Received payment webhook job: ${job.id}`);

    const paymentData = job.data.paymentData;

    // 3. Simulate processing time (e.g., verifying with the bank)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.logger.log(
      `Successfully processed payment for transaction: ${paymentData.transactionId}`,
    );
  }
}
