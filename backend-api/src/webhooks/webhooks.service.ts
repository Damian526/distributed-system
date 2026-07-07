import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Queue } from 'bullmq';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-06-24.dahlia',
  });

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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Stripe nie wysyła nazwy produktu w samej sesji — trzeba dociągnąć line items
        const lineItems = await this.stripe.checkout.sessions.listLineItems(
          session.id,
        );
        const productName = lineItems.data[0]?.description || 'Unknown Product';

        await this.webhookQueue.add(
          'process-payment',
          {
            transactionId: session.id,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? 'usd').toUpperCase(),
            customerEmail:
              session.customer_details?.email || 'unknown@example.com',
            customerFirstName:
              session.customer_details?.name?.split(' ')[0] || 'Unknown',
            customerLastName:
              session.customer_details?.name?.split(' ')[1] || 'Customer',
            country: session.customer_details?.address?.country || 'PL', // NAPRAWDĘ wpisany kraj!
            city: session.customer_details?.address?.city || 'Unknown',
            status: 'PAID',
            productName,
          },
          { jobId: session.id, removeOnComplete: true, removeOnFail: 100 },
        );

        this.logger.log(`📨 Queued real checkout payment: ${session.id}`);
        break;
      }
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
