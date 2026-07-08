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
import { REPORTS_BUCKET, s3Client } from '../storage/s3.client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerReport(@Body() dto: CreateReportDto): Promise<ReportTask> {
    return this.reportsService.generateReport(dto.year, dto.scopeRegion);
  }

  @Get()
  async listRecent(): Promise<ReportTask[]> {
    return this.reportsService.listRecent();
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

    if (task.status !== 'COMPLETED' || !task.fileKey) {
      throw new NotFoundException('Report not ready for download');
    }
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: REPORTS_BUCKET, Key: task.fileKey }),
      { expiresIn: 300 },
    );
    res.redirect(302, url);
  }
}
