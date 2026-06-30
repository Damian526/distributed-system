import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportTask } from '@prisma/client';
import * as fs from 'fs';
import type { Response } from 'express';

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

  @Get(':id/download')
  async downloadReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const task = await this.reportsService.getReportStatus(id);

    if (task.status !== 'COMPLETED' || !task.filePath) {
      throw new NotFoundException('Report not ready for download');
    }
    if (!fs.existsSync(task.filePath)) {
      throw new NotFoundException('Report file not found');
    }
    res.download(task.filePath);
  }
}
