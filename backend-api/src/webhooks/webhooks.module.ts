import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'webhook-queue' })],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
