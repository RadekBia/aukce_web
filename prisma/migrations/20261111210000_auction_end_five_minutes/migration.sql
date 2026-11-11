-- Existing rows end five minutes after this migration runs.
-- Prisma stores TIMESTAMP WITHOUT TIME ZONE as UTC, so convert the
-- current instant to UTC before adding the interval. Display stays Europe/Prague.
UPDATE "Auction"
SET "endsAt" = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '5 minutes';
