import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Queue } from 'bullmq';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) {}

  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    if (event.type !== 'payment_intent.succeeded') {
      this.logger.log(`ℹ️ Ignoring unhandled event type: ${event.type}`);
      return;
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await this.webhookQueue.add(
      'process-payment',
      {
        transactionId: paymentIntent.id, // e.g. "pi_3Nx..."
        amount: paymentIntent.amount / 100, // Stripe uses cents — convert to whole units
        currency: paymentIntent.currency.toUpperCase(), // e.g. "usd" → "USD"
        customerEmail: paymentIntent.receipt_email || 'test@example.com',
      },
      {
        jobId: paymentIntent.id, // dedupe by Stripe's own ID
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log(`📨 Queued payment: ${paymentIntent.id}`);
  }
}
