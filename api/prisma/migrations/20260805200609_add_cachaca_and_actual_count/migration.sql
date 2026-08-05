/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSale` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PayoutCategory" AS ENUM ('VISITS', 'PRODUCTS', 'GENERAL');

-- DropForeignKey
ALTER TABLE "ProductSale" DROP CONSTRAINT "ProductSale_productId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "actualPeopleCount" INTEGER;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "category" "PayoutCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "cachacaCommission" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cachacaPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "ProductSale";

-- CreateTable
CREATE TABLE "CachacaSale" (
    "id" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "bottleCount" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "commissionSnapshot" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachacaSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CachacaSale_soldAt_idx" ON "CachacaSale"("soldAt");
