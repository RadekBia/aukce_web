import Link from "next/link";
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

  if (loggedIn) {
    const rows = await prisma.auction.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { bids: true } } },
      take: 200,
    });
    auctions = rows.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      currentPrice: a.currentPrice,
      endsAt: a.endsAt.toISOString(),
      bidCount: a._count.bids,
    }));
  }

  return (
    <main>
      <header>
        <Link className="brand" href="/">
          Aukceee <span>na dobrou Věc</span>
        </Link>
        <Link href="/" className="btn secondary">
          ← Veřejný přehled
        </Link>
      </header>
      <section className="form admin-form">
        <p className="eyebrow">SPRÁVA</p>
        <h1>Administrace aukcí</h1>
        {loggedIn ? (
          <AdminPanel auctions={auctions} />
        ) : (
          <AdminLoginForm configured={configured} />
        )}
      </section>
    </main>
  );
}
