import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

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
}
