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
    job: Job<{
      transactionId: string;
      amount: number;
      currency: string;
      customerEmail: string;
      customerFirstName: string;
      customerLastName: string;
      customerCity: string;
      productName: string;
    }>,
  ): Promise<void> {
    const {
      transactionId,
      amount,
      currency,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerCity,
      productName,
    } = job.data;
    this.logger.log(`📥 Processing payment job: ${job.id}`);

    try {
      const customer = await this.prisma.customer.upsert({
        where: { email: customerEmail },
        update: {},
        create: {
          email: customerEmail,
          firstName: customerFirstName,
          lastName: customerLastName,
          city: customerCity,
          country: 'PL',
        },
      });

      await this.prisma.order.create({
        data: {
          transactionId,
          amount,
          currency,
          status: 'PAID',
          productName,
          customerId: customer.id,
        },
      });

      this.logger.log(
        `✅ Order saved: ${transactionId} — linked to ${customer.email}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`⚠️ Duplicate transaction ignored: ${transactionId}`);
        return;
      }
      this.logger.error(`❌ Failed to save order: ${(error as Error).message}`);
      throw error;
    }
  }
}
