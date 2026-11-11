-- Fixed end for every existing row: 26. 11. 2026 23:59 Europe/Prague = 22:59 UTC.
UPDATE "Auction" SET "endsAt" = TIMESTAMP '2026-11-26 22:59:00';
