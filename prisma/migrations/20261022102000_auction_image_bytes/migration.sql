-- CreateTable
CREATE TABLE "AuctionImage" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT,
    "mimeType" VARCHAR(64) NOT NULL,
    "data" BYTEA NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionImage_auctionId_sortOrder_idx" ON "AuctionImage"("auctionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AuctionImage" ADD CONSTRAINT "AuctionImage_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
