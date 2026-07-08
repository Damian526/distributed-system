import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { ProcessorsModule } from './processors/processors.module';

@Module({
  imports: [
    // tells the worker where Redis lives
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    ProcessorsModule, // this is where the actual job processors live
  ],
})
export class AppModule {}
