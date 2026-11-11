/**
 * Shared auction business rules (create / bid / display).
 * A new auction ends five minutes after it is created.
 * Times are absolute instants; the UI shows them in Europe/Prague.
 */
export const AUCTION_STARTING_PRICE = 1;
export const MIN_BID_RAISE = 10;

/** How long a newly created auction stays open. */
export const AUCTION_DURATION_MS = 5 * 60 * 1000;

/** End instant: five minutes after `from` (default: now). */
export function auctionEndsAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + AUCTION_DURATION_MS);
}

export function sellerDisplayName(
  firstName: string,
  lastName: string,
): string {
  const n = `${firstName ?? ""} ${lastName ?? ""}`.replace(/\s+/g, " ").trim();
  return n || "Neuvedeno";
}
