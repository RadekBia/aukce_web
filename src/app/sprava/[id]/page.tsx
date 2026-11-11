import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { dbErrorCode } from "@/lib/runtime-env";
import { AdminEditForm } from "./edit-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type EditAuction = Prisma.AuctionGetPayload<{
  include: { _count: { select: { bids: true; images: true } } };
}>;

export default async function SpravaEditPage({ params }: Props) {
  const configured = isAdminConfigured();
  const loggedIn = configured && (await isAdminSession());

  if (!configured) {
    redirect("/sprava");
  }
  if (!loggedIn) {
    redirect("/sprava");
  }

  const { id } = await params;
  let auction: EditAuction | null = null;
  try {
    auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        _count: { select: { bids: true, images: true } },
      },
    });
  } catch (err) {
    console.error("sprava edit query failed", dbErrorCode(err));
    return (
      <main>
        <SiteHeader
          showAdmin={false}
          actions={
            <Link href="/sprava" className="btn secondary">
              ← Zpět na správu
            </Link>
          }
        />
        <section className="form admin-form">
          <p className="eyebrow">SPRÁVA</p>
          <h1>Upravit aukci</h1>
          <p className="notice">
            Databáze není připojena. Nastavte DATABASE_URL a spusťte migrace.
          </p>
        </section>
      </main>
    );
  }
  if (!auction) notFound();

  return (
    <main>
      <SiteHeader
        showAdmin={false}
        actions={
          <Link href="/sprava" className="btn secondary">
            ← Zpět na správu
          </Link>
        }
      />
      <section className="form admin-form">
        <p className="eyebrow">SPRÁVA</p>
        <h1>Upravit aukci</h1>
        <p className="bid-hint" style={{ marginBottom: 12 }}>
          {auction.title}
        </p>
        <AdminEditForm
          auction={{
            id: auction.id,
            title: auction.title,
            description: auction.description,
            category: auction.category,
            condition: auction.condition,
            sellerFirstName: auction.sellerFirstName,
            sellerLastName: auction.sellerLastName,
            startingPrice: auction.startingPrice,
            currentPrice: auction.currentPrice,
            status: auction.status,
            endsAt: auction.endsAt.toISOString(),
            bidCount: auction._count.bids,
            photoCount: auction._count.images,
          }}
        />
      </section>
    </main>
  );
}
