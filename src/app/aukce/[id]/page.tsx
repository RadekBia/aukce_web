import Link from "next/link";
import { notFound } from "next/navigation";
import { auctionImageList } from "@/lib/auction-images";
import { prisma } from "@/lib/prisma";
import { BidPanel } from "./bid-panel";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);

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

  const ended = auction.endsAt.getTime() <= Date.now();
  const canBid = auction.status === "ACTIVE" && !ended;
  const endsLabel = auction.endsAt.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const images = auctionImageList(auction);

  return (
    <main>
      <header>
        <Link className="brand" href="/">
          Aukceee <span>na dobrou Věc</span>
        </Link>
        <nav>
          <Link href="/#aukce">Aukce</Link>
        </nav>
        <Link href="/" className="btn secondary">
          ← Zpět na přehled
        </Link>
      </header>

      <section className="detail">
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
        <div className="detail-body">
          <p className="eyebrow">DETAIL AUKCE</p>
          <h1>{auction.title}</h1>
          <p className="cat-badge detail-cat">
            <span className="cat-badge-label">Kategorie</span>
            <span className="cat-badge-value">{auction.category}</span>
          </p>
          <p className="detail-meta">
            Stav: {auction.condition}
          </p>
          <p className="detail-meta">
            {statusLabel[auction.status] ?? auction.status}
            {ended && auction.status === "ACTIVE" ? " (čas vypršel)" : ""}
          </p>
          <div className="detail-prices">
            <div>
              <small>Aktuální cena</small>
              <strong>{money(auction.currentPrice)}</strong>
            </div>
            <div>
              <small>Vyvolávací cena</small>
              <strong className="muted-price">
                {money(auction.startingPrice)}
              </strong>
            </div>
          </div>
          <p className="detail-ends">
            {ended ? "Skončila" : "Končí"} {endsLabel}
          </p>
          <h2>Popis</h2>
          <p className="detail-desc">{auction.description}</p>

          <BidPanel
            auctionId={auction.id}
            currentPrice={auction.currentPrice}
            canBid={canBid}
            initialBids={bids.map((b) => ({
              id: b.id,
              bidderId: b.bidderId,
              amount: b.amount,
              createdAt: b.createdAt.toISOString(),
            }))}
          />

          <Link className="btn secondary" href="/#aukce">
            Další aukce
          </Link>
        </div>
      </section>
    </main>
  );
}
