/**
 * Server-only feature flags. Do not import from Client Components —
 * non-NEXT_PUBLIC_ env vars are unavailable in the browser bundle.
 */

function parseTriState(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw === "") return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return undefined;
}

/**
 * Unauthenticated create is OFF — Google sign-in is required.
 * Emergency reopen (not recommended): ENABLE_UNAUTHENTICATED_AUCTION_CREATION=true
 */
export function isUnauthenticatedAuctionCreationEnabled(): boolean {
  const explicit = parseTriState(
    process.env.ENABLE_UNAUTHENTICATED_AUCTION_CREATION,
  );
  if (explicit !== undefined) return explicit;
  return false;
}
