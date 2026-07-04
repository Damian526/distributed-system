/*
  Warnings:

  - You are about to drop the column `filePath` on the `report_tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "report_tasks" DROP COLUMN "filePath",
ADD COLUMN     "fileKey" TEXT;
