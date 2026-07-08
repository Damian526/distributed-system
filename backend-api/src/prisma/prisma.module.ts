import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // so every module can use PrismaService without importing it
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
