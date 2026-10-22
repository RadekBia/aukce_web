-- AlterTable
ALTER TABLE "Auction" ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
