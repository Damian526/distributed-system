import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportTask } from '@prisma/client';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerReport(@Body() dto: CreateReportDto): Promise<ReportTask> {
    return this.reportsService.generateReport(dto.year, dto.scopeRegion);
  }

  @Get(':id')
  async getStatus(@Param('id', ParseUUIDPipe) id: string): Promise<ReportTask> {
    return this.reportsService.getReportStatus(id);
  }
}
