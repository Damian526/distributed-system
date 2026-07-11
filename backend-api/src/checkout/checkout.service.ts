import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

export interface CheckoutSessionStatus {
  status: 'paid' | 'unpaid' | 'no_payment_required';
  amount: number;
  currency: string;
  productName: string;
  customerEmail: string | null;
}

@Injectable()
export class CheckoutService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  async createSession(dto: CreateCheckoutDto) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required', // makes Stripe ask for a real address/country
      customer_creation: 'always',
      line_items: [
        {
          price_data: {
            currency: dto.currency,
            product_data: { name: dto.productName },
            unit_amount: Math.round(dto.amount * 100), // Stripe counts in cents, not whole units
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    return { url: session.url }; // frontend just redirects the browser here
  }

  async getSessionStatus(sessionId: string): Promise<CheckoutSessionStatus> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    return {
      status: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? 'usd').toUpperCase(),
      productName: session.line_items?.data[0]?.description || 'Unknown Product',
      customerEmail: session.customer_details?.email ?? null,
    };
  }
}
