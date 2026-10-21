import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  try {
    auction = await prisma.auction.findUnique({ where: { id } });
  } catch {
    notFound();
  }
  if (!auction) notFound();

  const ended = auction.endsAt.getTime() <= Date.now();
  const endsLabel = auction.endsAt.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
        {auction.imageUrl && (
          <img
            className="detail-image"
            src={auction.imageUrl}
            alt={auction.title}
          />
        )}
        <div className="detail-body">
          <p className="eyebrow">DETAIL AUKCE</p>
          <h1>{auction.title}</h1>
          <p className="detail-meta">
            {auction.category} · {auction.condition} ·{" "}
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
          <p className="notice">
            Přihazování bude dostupné po doplnění přihlášení. Zatím si můžete
            aukci prohlédnout.
          </p>
          <Link className="btn" href="/#aukce">
            Další aukce
          </Link>
        </div>
      </section>
    </main>
  );
}
