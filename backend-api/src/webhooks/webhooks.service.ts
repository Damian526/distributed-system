import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

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
      },
      {
        // Using transactionId as the jobId means Redis ignores duplicates.
        jobId: dto.transactionId,
        // Auto-clean finished/failed jobs so Redis doesn't fill up.
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log(`📨 Queued payment: ${dto.transactionId}`);

    return { received: true, transactionId: dto.transactionId };
  }
}
