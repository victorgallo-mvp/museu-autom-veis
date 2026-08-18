-- CreateEnum
CREATE TYPE "PhotoSessionEventType" AS ENUM ('WEDDING', 'BIRTHDAY', 'OTHER');

-- AlterEnum
ALTER TYPE "PayoutCategory" ADD VALUE 'PHOTOS';

-- CreateTable
CREATE TABLE "PhotoSession" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "eventType" "PhotoSessionEventType" NOT NULL,
    "sessionAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoSession_sessionAt_idx" ON "PhotoSession"("sessionAt");
