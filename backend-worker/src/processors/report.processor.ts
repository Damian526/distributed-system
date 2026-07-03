import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { buildReportHtml } from './report-template';
@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    const { taskId, year, scopeRegion } = job.data;
    this.logger.log(`Starting report generation for Task ID: ${taskId}`);

    try {
      //  Start the job: Change DB status from PENDING to PROCESSING
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { status: 'PROCESSING', progress: 10 },
      });
      await job.updateProgress(10); // Tells Redis we are at 10%

      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year + 1}-01-01T00:00:00Z`);

      // Simulate Heavy Database Analytics (Wait 3 seconds)
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          customer: { country: scopeRegion },
        },
        select: { amount: true, status: true, createdAt: true },
      });

      // Update progress
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { progress: 50 },
      });
      await job.updateProgress(50);

      const monthlySales = new Array(12).fill(0);
      const statusBreakdown = { paid: 0, refunded: 0, failed: 0 };
      let totalSales = 0;

      for (const o of orders) {
        const amount = Number(o.amount);
        const month = o.createdAt.getMonth();
        if (o.status === 'PAID') {
          monthlySales[month] += amount;
          totalSales += amount;
          statusBreakdown.paid++;
        } else if (o.status === 'REFUNDED') {
          statusBreakdown.refunded++;
        } else if (o.status === 'FAILED') {
          statusBreakdown.failed++;
        }
      }

      const monthlyRouned = monthlySales.map((v) => Math.round(v));

      const html = buildReportHtml({
        year,
        scopeRegion,
        totalSales: Math.round(totalSales),
        orderCount: orders.length,
        monthlySales: monthlyRouned,
        statusBreakdown,
      });

      const fileName = `report_${year}_${scopeRegion}_${Date.now()}.pdf`;
      const reportsDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(reportsDir, { recursive: true });
      const filePath = path.join(reportsDir, fileName);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        await page.waitForFunction('window.chartsReady === true', {
          timeout: 10000,
        });
        await page.pdf({
          path: filePath,
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        });
      } finally {
        await browser.close();
      }

      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          filePath: filePath,
        },
      });
      await job.updateProgress(100);

      this.logger.log(`✅ Report generated successfully: ${fileName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // 5. If ANYTHING fails (DB crashes, file system full), mark it as FAILED safely.
      this.logger.error(`❌ Job failed: ${errorMessage}`);
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { status: 'FAILED', errorMessage: errorMessage },
      });
      throw error; // Let BullMQ know it failed so it can trigger a retry if configured.
    }
  }
}
