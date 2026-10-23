import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * currentPrice = startingPrice + sum of all bid raises (time order).
 * Does not modify bids or other auction fields.
 */
export async function recomputeAuctionCurrentPrice(
  tx: Tx,
  auctionId: string,
): Promise<{ currentPrice: number; startingPrice: number }> {
  const auction = await tx.auction.findUniqueOrThrow({
    where: { id: auctionId },
    select: { startingPrice: true },
  });
  const bids = await tx.bid.findMany({
    where: { auctionId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { amount: true },
  });
  const currentPrice =
    auction.startingPrice + bids.reduce((sum, b) => sum + b.amount, 0);

  await tx.auction.update({
    where: { id: auctionId },
    data: { currentPrice },
  });

  return { currentPrice, startingPrice: auction.startingPrice };
}

/** Running total after each bid (time order). */
export function runningTotalsAfterBids(
  startingPrice: number,
  bidsAsc: { id: string; amount: number }[],
): Map<string, number> {
  const map = new Map<string, number>();
  let run = startingPrice;
  for (const b of bidsAsc) {
    run += b.amount;
    map.set(b.id, run);
  }
  return map;
}
