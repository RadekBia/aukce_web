-- Optional admin-recorded winner (override of highest bidder).

ALTER TABLE "Auction" ADD COLUMN "winnerFirstName" VARCHAR(40);
ALTER TABLE "Auction" ADD COLUMN "winnerLastName" VARCHAR(40);
