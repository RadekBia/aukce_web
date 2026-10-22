import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, bidderIdFromSession } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { isAuthConfigured } from "@/lib/auth-env";
import { auctionImageList } from "@/lib/auction-images";
import { prisma } from "@/lib/prisma";
import {
  BidFields,
  BidList,
  BidPriceRow,
  BidProvider,
} from "./bid-panel";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  DRAFT: "Koncept",
  ACTIVE: "Aktivní",
  ENDED: "Ukončená",
  CANCELLED: "Zrušená",
};

export default async function AuctionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let auction;
  let bids: Awaited<ReturnType<typeof prisma.bid.findMany>> = [];
  try {
    auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (auction) {
      bids = await prisma.bid.findMany({
        where: { auctionId: id },
        orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
        take: 50,
      });
    }
  } catch {
    notFound();
  }
  if (!auction) notFound();

  const session = isAuthConfigured() ? await auth() : null;
  const accountLabel =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    (session ? bidderIdFromSession(session) : null);
  const signedIn = Boolean(session?.user && accountLabel);

  const ended = auction.endsAt.getTime() <= Date.now();
  const canBid = auction.status === "ACTIVE" && !ended;
  const endsLabel = auction.endsAt.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const images = auctionImageList(auction);
  const initialBids = bids.map((b) => ({
    id: b.id,
    bidderId: b.bidderId,
    amount: b.amount,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <main>
      <SiteHeader
        nav={<Link href="/#aukce">Aukce</Link>}
        actions={
          <Link href="/" className="btn secondary">
            ← Zpět na přehled
          </Link>
        }
      />

      <BidProvider
        auctionId={auction.id}
        currentPrice={auction.currentPrice}
        startingPrice={auction.startingPrice}
        canBid={canBid}
        signedIn={signedIn}
        accountLabel={accountLabel}
        initialBids={initialBids}
      >
        <section className="detail">
          <div className="detail-left">
            {images.length > 0 && (
              <div className="detail-gallery">
                {images.map((src, i) => (
                  <img
                    key={src}
                    className={i === 0 ? "detail-image" : "detail-image thumb"}
                    src={src}
                    alt={`${auction.title} — fotka ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <BidList />
          </div>

          <div className="detail-body">
            <p className="eyebrow">DETAIL AUKCE</p>
            <h1>{auction.title}</h1>
            <p className="cat-badge detail-cat">
              <span className="cat-badge-label">Kategorie</span>
              <span className="cat-badge-value">{auction.category}</span>
            </p>
            <p className="detail-meta">Stav: {auction.condition}</p>
            <p className="detail-meta">
              {statusLabel[auction.status] ?? auction.status}
              {ended && auction.status === "ACTIVE" ? " (čas vypršel)" : ""}
            </p>

            <BidPriceRow />

            <p className="detail-ends">
              {ended ? "Skončila" : "Končí"} {endsLabel}
            </p>
            <h2>Popis</h2>
            <p className="detail-desc">{auction.description}</p>

            <BidFields />

            <Link className="btn secondary" href="/#aukce">
              Další aukce
            </Link>
          </div>
        </section>
      </BidProvider>
    </main>
  );
}
