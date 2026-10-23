import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { runningTotalsAfterBids } from "@/lib/recompute-auction-price";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "./admin-panel";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function SpravaPage({
  searchParams,
}: {
  searchParams: Promise<{ ulozeno?: string }>;
}) {
  const { ulozeno } = await searchParams;
  const saved = ulozeno === "1";
  const configured = isAdminConfigured();
  const loggedIn = configured && (await isAdminSession());

  let auctions: {
    id: string;
    title: string;
    status: string;
    currentPrice: number;
    endsAt: string;
    bidCount: number;
  }[] = [];

  let bids: {
    id: string;
    amount: number;
    resultingPrice: number;
    bidderId: string;
    createdAt: string;
    auctionId: string;
    auctionTitle: string;
  }[] = [];

  if (loggedIn) {
    const [rows, bidRows] = await Promise.all([
      prisma.auction.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { bids: true } } },
        take: 200,
      }),
      prisma.bid.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          auction: {
            select: { id: true, title: true, startingPrice: true },
          },
        },
      }),
    ]);

    auctions = rows.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      currentPrice: a.currentPrice,
      endsAt: a.endsAt.toISOString(),
      bidCount: a._count.bids,
    }));

    const auctionIds = Array.from(new Set(bidRows.map((b) => b.auctionId)));
    const startingByAuction = new Map(
      bidRows.map((b) => [b.auctionId, b.auction.startingPrice] as const),
    );

    const allBidsAsc =
      auctionIds.length === 0
        ? []
        : await prisma.bid.findMany({
            where: { auctionId: { in: auctionIds } },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { id: true, auctionId: true, amount: true },
          });

    const resultingByBidId = new Map<string, number>();
    for (const aid of auctionIds) {
      const start = startingByAuction.get(aid) ?? 0;
      const forAuction = allBidsAsc.filter((b) => b.auctionId === aid);
      const totals = runningTotalsAfterBids(start, forAuction);
      for (const [bidId, total] of totals) {
        resultingByBidId.set(bidId, total);
      }
    }

    bids = bidRows.map((b) => ({
      id: b.id,
      amount: b.amount,
      resultingPrice: resultingByBidId.get(b.id) ?? b.auction.startingPrice + b.amount,
      bidderId: b.bidderId,
      createdAt: b.createdAt.toISOString(),
      auctionId: b.auction.id,
      auctionTitle: b.auction.title,
    }));
  }

  return (
    <main>
      <SiteHeader
        showAdmin={false}
        actions={
          <Link href="/" className="btn secondary">
            ← Veřejný přehled
          </Link>
        }
      />
      <section className="form admin-form">
        <p className="eyebrow">SPRÁVA</p>
        <h1>Administrace aukcí</h1>
        {!configured && (
          <p className="bid-error">
            Administrace je vypnutá — na Vercelu chybí env{" "}
            <code>ADMIN_SECRET</code>. Přidejte ji a znovu nasaďte aplikaci.
          </p>
        )}
        {loggedIn ? (
          <AdminPanel auctions={auctions} bids={bids} saved={saved} />
        ) : (
          <AdminLoginForm configured={configured} />
        )}
      </section>
    </main>
  );
}
