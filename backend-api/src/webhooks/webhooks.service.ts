import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Queue } from 'bullmq';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) {}

  async handlePayment(
    dto: WebhookPayloadDto,
  ): Promise<{ received: boolean; transactionId: string }> {
    await this.webhookQueue.add(
      'process-payment',
      {
        transactionId: dto.transactionId,
        amount: dto.amount,
        currency: dto.currency,
        customerEmail: dto.customerEmail,
        customerFirstName: dto.customerFirstName,
        customerLastName: dto.customerLastName,
        customerCity: dto.customerCity,
        productName: dto.productName,
      },
      {
        jobId: dto.transactionId,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    this.logger.log(`Queue payment: ${dto.transactionId}`);
    return { received: true, transactionId: dto.transactionId };
  }
}
