import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('api/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async createSession(@Body() dto: CreateCheckoutDto) {
    return this.checkoutService.createSession(dto);
  }

  @Get('session/:sessionId')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    return this.checkoutService.getSessionStatus(sessionId);
  }
}
