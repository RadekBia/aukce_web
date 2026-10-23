/** Split stored "Jméno Příjmení" bidder id into two parts. */
export function splitBidderName(bidderId: string): {
  firstName: string;
  lastName: string;
} {
  const parts = bidderId.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export function hasWinnerOverride(
  winnerFirstName: string | null | undefined,
  winnerLastName: string | null | undefined,
): boolean {
  return Boolean(
    (winnerFirstName ?? "").trim() || (winnerLastName ?? "").trim(),
  );
}

export function formatWinnerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
}

/**
 * Effective winner: stored override, else last bid in time order
 * (highest recomputed total), else none.
 */
export function resolveAuctionWinner(input: {
  winnerFirstName: string | null | undefined;
  winnerLastName: string | null | undefined;
  /** Bids ascending by time (createdAt, id). */
  bidsAsc: { bidderId: string }[];
}): {
  firstName: string;
  lastName: string;
  display: string;
  source: "override" | "bid" | "none";
} {
  if (hasWinnerOverride(input.winnerFirstName, input.winnerLastName)) {
    const firstName = (input.winnerFirstName ?? "").trim();
    const lastName = (input.winnerLastName ?? "").trim();
    return {
      firstName,
      lastName,
      display: formatWinnerName(firstName, lastName) || "bez vítěze",
      source: "override",
    };
  }
  const last = input.bidsAsc[input.bidsAsc.length - 1];
  if (!last) {
    return {
      firstName: "",
      lastName: "",
      display: "bez vítěze",
      source: "none",
    };
  }
  const { firstName, lastName } = splitBidderName(last.bidderId);
  return {
    firstName,
    lastName,
    display: formatWinnerName(firstName, lastName) || last.bidderId,
    source: "bid",
  };
}
