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
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.queuePaymentEvent(event, 'PAID');
        break;

      case 'payment_intent.payment_failed':
        await this.queuePaymentEvent(event, 'FAILED');
        break;

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.webhookQueue.add(
          'process-payment',
          {
            transactionId: charge.payment_intent as string, // refunds reference the original payment
            amount: charge.amount / 100,
            currency: charge.currency.toUpperCase(),
            customerEmail: charge.receipt_email || 'test@example.com',
            status: 'REFUNDED',
          },
          {
            jobId: `${charge.payment_intent}_refund`, // different jobId so it doesn't collide with the original PAID job
            removeOnComplete: true,
            removeOnFail: 100,
          },
        );
        this.logger.log(`📨 Queued refund: ${charge.payment_intent}`);
        break;
      }

      default:
        this.logger.log(`ℹ️ Ignoring unhandled event type: ${event.type}`);
    }
  }

  private async queuePaymentEvent(
    event: Stripe.Event,
    status: 'PAID' | 'FAILED',
  ): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await this.webhookQueue.add(
      'process-payment',
      {
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        customerEmail: paymentIntent.receipt_email || 'test@example.com',
        status,
      },
      {
        jobId: paymentIntent.id,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log(`📨 Queued ${status} payment: ${paymentIntent.id}`);
  }
}
