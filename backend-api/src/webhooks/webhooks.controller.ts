import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Req,
  Headers
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import Stripe from 'stripe';
import type { Request } from 'express';


@Controller('api/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  );

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receivePayment(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean}> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!);

    } catch (err) {
      this.logger.error(`❌ Signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
       this.logger.log(`📥 Verified Stripe event: ${event.type} (${event.id})`);

    await this.webhooksService.handleStripeEvent(event);

    return { received: true };
  }
}
