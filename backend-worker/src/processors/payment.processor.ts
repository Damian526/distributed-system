import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Processor('webhook-queue')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ transactionId: string; amount: number; currency: string }>,
  ): Promise<void> {
    const { transactionId, amount, currency } = job.data;

    this.logger.log(`📥 Processing payment job: ${job.id}`);

    try {
      await this.prisma.order.create({
        data: {
          transactionId,
          amount,
          currency,
          status: 'PAID',
        },
      });

      this.logger.log(
        `✅ Order saved: ${transactionId} — ${amount} ${currency}`,
      );
    } catch (error) {
      // P2002 = unique constraint failed = duplicate transactionId
      // This is expected and safe to ignore
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`⚠️ Duplicate transaction ignored: ${transactionId}`);
        return;
      }

      // Any other error is a real failure — let BullMQ retry
      this.logger.error(`❌ Failed to save order: ${(error as Error).message}`);
      throw error;
    }
  }
}
