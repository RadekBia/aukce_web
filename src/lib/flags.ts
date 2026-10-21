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
 * Unlocks POST /api/auctions and the /aukce/nova form without login.
 *
 * - Explicit `true` / `1` → ON
 * - Explicit `false` / `0` → OFF
 * - Unset → ON in `development` only (local convenience); OFF in production
 *
 * Never set this to true in production / shared environments.
 */
export function isUnauthenticatedAuctionCreationEnabled(): boolean {
  const explicit = parseTriState(
    process.env.ENABLE_UNAUTHENTICATED_AUCTION_CREATION,
  );
  if (explicit !== undefined) return explicit;
  return process.env.NODE_ENV === "development";
}
