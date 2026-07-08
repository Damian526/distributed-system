import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { buildReportHtml } from './report-template';
import { CURRENCY_SYMBOLS, REGION_CURRENCY, convertCurrency } from './fx-rates';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, REPORTS_BUCKET } from '../storage/s3.client';
import * as os from 'os';
@Processor('report-queue')
export class ReportProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ReportProcessor.name);
  private browser: Browser | null = null;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }
  async onModuleDestroy() {
    await this.browser?.close();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    const { taskId, year, scopeRegion } = job.data;
    this.logger.log(`Starting report generation for Task ID: ${taskId}`);

    try {
      // mark the job as started
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { status: 'PROCESSING', progress: 10 },
      });
      await job.updateProgress(10);

      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year + 1}-01-01T00:00:00Z`);

      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          customer: { country: scopeRegion },
        },
        select: {
          amount: true,
          status: true,
          currency: true,
          productName: true,
          createdAt: true,
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      // halfway there
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { progress: 50 },
      });
      await job.updateProgress(50);

      // convert everything to one currency so we're not adding PLN + EUR + USD like they're the same thing
      const reportCurrency = REGION_CURRENCY[scopeRegion] ?? 'USD';
      const currencySymbol = CURRENCY_SYMBOLS[reportCurrency] ?? reportCurrency;

      const monthlySales = new Array(12).fill(0);
      const statusBreakdown = { paid: 0, refunded: 0, failed: 0 };
      const currencyBreakdown: Record<string, number> = {};
      const productRevenue: Record<string, number> = {};
      const customerSpend: Record<string, { name: string; total: number }> = {};
      let totalSales = 0;

      for (const o of orders) {
        const rawAmount = Number(o.amount);
        const month = o.createdAt.getMonth();

        if (o.status === 'PAID') {
          const amount = convertCurrency(rawAmount, o.currency, reportCurrency);

          monthlySales[month] += amount;
          totalSales += amount;
          statusBreakdown.paid++;
          // converted to base currency so the slices are actually comparable
          currencyBreakdown[o.currency] =
            (currencyBreakdown[o.currency] || 0) + amount;
          if (o.productName) {
            productRevenue[o.productName] =
              (productRevenue[o.productName] || 0) + amount;
          }
          if (o.customer) {
            const key = o.customer.id;
            const name =
              `${o.customer.firstName ?? ''} ${o.customer.lastName ?? ''}`.trim() ||
              o.customer.email;
            if (!customerSpend[key]) customerSpend[key] = { name, total: 0 };
            customerSpend[key].total += amount;
          }
        } else if (o.status === 'REFUNDED') {
          statusBreakdown.refunded++;
        } else if (o.status === 'FAILED') {
          statusBreakdown.failed++;
        }
      }

      const topCustomers = Object.values(customerSpend)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((c) => ({ ...c, total: Math.round(c.total) }));
      const topProducts = Object.entries(productRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
      const monthlyRouned = monthlySales.map((v) => Math.round(v));

      const totalOutcomes =
        statusBreakdown.paid +
        statusBreakdown.refunded +
        statusBreakdown.failed;
      const refundRate = totalOutcomes
        ? Math.round((statusBreakdown.refunded / totalOutcomes) * 1000) / 10
        : 0;
      const failedRate = totalOutcomes
        ? Math.round((statusBreakdown.failed / totalOutcomes) * 1000) / 10
        : 0;
      const uniqueCustomers = Object.keys(customerSpend).length;

      const html = buildReportHtml({
        year,
        scopeRegion,
        currencySymbol,
        totalSales: Math.round(totalSales),
        orderCount: orders.length,
        uniqueCustomers,
        refundRate,
        failedRate,
        monthlySales: monthlyRouned,
        statusBreakdown,
        currencyBreakdown,
        topCustomers,
        topProducts,
      });

      const fileName = `report_${year}_${scopeRegion}_${Date.now()}.pdf`;
      const tmpPath = path.join(os.tmpdir(), fileName);

      const browser = await this.getBrowser();
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        await page.waitForFunction('window.chartsReady === true', {
          timeout: 10000,
        });
        await page.pdf({
          path: tmpPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        });
        await page.close();
      } finally {
      }

      const fileBuffer = await fs.readFile(tmpPath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: REPORTS_BUCKET,
          Key: fileName,
          Body: fileBuffer,
          ContentType: 'application/pdf',
        }),
      );
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileKey: fileName,
        },
      });
      await job.updateProgress(100);

      this.logger.log(`✅ Report generated successfully: ${fileName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // something broke, save the error and mark the task as failed
      this.logger.error(`❌ Job failed: ${errorMessage}`);
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { status: 'FAILED', errorMessage: errorMessage },
      });
      throw error; // let BullMQ retry it if it's set up to
    }
  }
}
