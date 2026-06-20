import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

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
      // 1. Start the job: Change DB status from PENDING to PROCESSING
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { status: 'PROCESSING', progress: 10 },
      });
      await job.updateProgress(10); // Tells Redis we are at 10%

      // 2. Simulate Heavy Database Analytics (Wait 3 seconds)
      this.logger.log('Aggregating database rows...');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update progress
      await this.prisma.reportTask.update({
        where: { id: taskId },
        data: { progress: 50 },
      });
      await job.updateProgress(50);

      // 3. Generate Dummy "PDF" File (For now, it's a text file)
      this.logger.log('Compiling file structure...');
      const fileName = `report_${year}_${scopeRegion}_${Date.now()}.txt`;
      const filePath = path.join(process.cwd(), fileName);

      await fs.writeFile(
        filePath,
        `FINANCIAL REPORT FOR ${year} - REGION: ${scopeRegion}\n\nTotal Sales: $1,000,000`,
      );

      // Simulate rendering time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Finish the job: Mark as COMPLETED and save the file path to the DB
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
