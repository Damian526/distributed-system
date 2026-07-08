import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '@prisma/client';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listRecent(): Promise<Order[]> {
    return this.ordersService.listRecent();
  }
}
