-- AlterEnum
ALTER TYPE "PayoutCategory" ADD VALUE 'SOUVENIRS';

-- CreateTable
CREATE TABLE "Souvenir" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Souvenir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SouvenirSale" (
    "id" TEXT NOT NULL,
    "souvenirId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "commissionSnapshot" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SouvenirSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Souvenir_active_idx" ON "Souvenir"("active");

-- CreateIndex
CREATE INDEX "SouvenirSale_soldAt_idx" ON "SouvenirSale"("soldAt");

-- CreateIndex
CREATE INDEX "SouvenirSale_souvenirId_idx" ON "SouvenirSale"("souvenirId");

-- AddForeignKey
ALTER TABLE "SouvenirSale" ADD CONSTRAINT "SouvenirSale_souvenirId_fkey" FOREIGN KEY ("souvenirId") REFERENCES "Souvenir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
