-- Seller name on auction + fixed end for all rows (20. 11. 2026 23:59 Europe/Prague = 22:59 UTC).

ALTER TABLE "Auction" ADD COLUMN "sellerFirstName" VARCHAR(40) NOT NULL DEFAULT 'Neuvedeno';
ALTER TABLE "Auction" ADD COLUMN "sellerLastName" VARCHAR(40) NOT NULL DEFAULT '';

UPDATE "Auction" SET "endsAt" = TIMESTAMP '2026-11-20 22:59:00';
