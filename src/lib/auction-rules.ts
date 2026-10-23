/**
 * Shared auction business rules (create / bid / display).
 * End: 20. 11. 2026 23:59 Europe/Prague (= 22:59 UTC).
 */
export const AUCTION_STARTING_PRICE = 1;
export const MIN_BID_RAISE = 10;

/** Fixed end instant for every auction. */
export const AUCTION_ENDS_AT = new Date("2026-11-20T22:59:00.000Z");

/** Czech label for the fixed end (Europe/Prague wall clock). */
export const AUCTION_ENDS_LABEL_CS = "20. 11. 2026 23:59";

export function sellerDisplayName(
  firstName: string,
  lastName: string,
): string {
  const n = `${firstName ?? ""} ${lastName ?? ""}`.replace(/\s+/g, " ").trim();
  return n || "Neuvedeno";
}
