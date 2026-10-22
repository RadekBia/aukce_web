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
 * TEMPORARY until Google SSO / real auth: unauthenticated create is ON by default
 * (local + production) so the live site can accept new auctions.
 *
 * Lock early without waiting for SSO:
 *   ENABLE_UNAUTHENTICATED_AUCTION_CREATION=false
 *
 * When SSO lands: flip `UNAUTHENTICATED_CREATE_UNTIL_SSO` to false (or delete this
 * path and require a session).
 */
const UNAUTHENTICATED_CREATE_UNTIL_SSO = true;

export function isUnauthenticatedAuctionCreationEnabled(): boolean {
  const explicit = parseTriState(
    process.env.ENABLE_UNAUTHENTICATED_AUCTION_CREATION,
  );
  if (explicit !== undefined) return explicit;
  return UNAUTHENTICATED_CREATE_UNTIL_SSO;
}
