/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transaction_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "transaction_id" TEXT NOT NULL,
ALTER COLUMN "customer_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_transaction_id_key" ON "orders"("transaction_id");
