import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receivePaymentWebhook(
    @Body() payload: WebhookPayloadDto,
  ): Promise<{ message: string }> {
    await this.webhookQueue.add('process-payment', {
      paymentData: payload,
      receivedAt: new Date().toISOString(),
    });

    return { message: 'Webhook queued successfully.' };
  }
}
