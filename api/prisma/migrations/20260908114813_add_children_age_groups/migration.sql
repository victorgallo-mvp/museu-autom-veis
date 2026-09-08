-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "actualChildrenFree" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "actualChildrenHalf" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expectedChildrenFree" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expectedChildrenHalf" INTEGER NOT NULL DEFAULT 0;
