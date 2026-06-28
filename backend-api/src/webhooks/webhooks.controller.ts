import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Controller('api/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receivePayment(
    @Body() dto: WebhookPayloadDto,
  ): Promise<{ received: boolean; transactionId: string }> {
    this.logger.log(`📥 Webhook received: ${dto.transactionId}`);
    return this.webhooksService.handlePayment(dto);
  }
}
