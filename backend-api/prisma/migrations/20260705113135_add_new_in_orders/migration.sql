/*
  Warnings:

  - Added the required column `product_name` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `customer_id` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "product_name" TEXT NOT NULL,
ALTER COLUMN "customer_id" SET NOT NULL;
