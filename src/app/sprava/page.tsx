import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "./admin-panel";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function SpravaPage() {
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
        include: { auction: { select: { id: true, title: true } } },
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
    bids = bidRows.map((b) => ({
      id: b.id,
      amount: b.amount,
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
          <AdminPanel auctions={auctions} bids={bids} />
        ) : (
          <AdminLoginForm configured={configured} />
        )}
      </section>
    </main>
  );
}
