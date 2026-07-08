import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ReportTask } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('report-queue') private readonly reportQueue: Queue,
  ) {}

  async generateReport(year: number, scopeRegion: string): Promise<ReportTask> {
    const task = await this.prisma.reportTask.create({
      data: { year, scopeRegion, status: 'PENDING' },
    });

    await this.reportQueue.add('process-report-job', {
      taskId: task.id,
      year,
      scopeRegion,
    });

    return task;
  }

  async getReportStatus(id: string): Promise<ReportTask> {
    const task = await this.prisma.reportTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Report not found');
    return task;
  }

  async listRecent(limit = 20): Promise<ReportTask[]> {
    return this.prisma.reportTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
