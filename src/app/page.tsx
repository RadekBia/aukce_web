import Link from "next/link";
import { AuctionCountdown } from "@/components/auction-countdown";
import { SiteHeader } from "@/components/site-header";
import { coverImageUrl } from "@/lib/auction-images";
import { sellerDisplayName } from "@/lib/auction-rules";
import { resolveAuctionWinner } from "@/lib/auction-winner";
import { prisma } from "@/lib/prisma";
import { dbErrorCode } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategorie?: string }>;
}) {
  const { kategorie: rawCat } = await searchParams;
  const selectedCategory = rawCat?.trim() || null;

  let auctions: Awaited<
    ReturnType<
      typeof prisma.auction.findMany<{
        include: {
          images: { select: { id: true }; orderBy: { sortOrder: "asc" } };
        };
      }>
    >
  > = [];
  let categories: string[] = [];
  let ended: { id: string; title: string; currentPrice: number; winner: string }[] =
    [];
  let db = true;

  try {
    const activeWhere = {
      status: "ACTIVE" as const,
      endsAt: { gt: new Date() },
    };

    const [rows, distinct, endedRows] = await Promise.all([
      prisma.auction.findMany({
        where: {
          ...activeWhere,
          ...(selectedCategory ? { category: selectedCategory } : {}),
        },
        orderBy: { endsAt: "asc" },
        take: 40,
        include: {
          images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.auction.findMany({
        where: activeWhere,
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
      prisma.auction.findMany({
        where: {
          endsAt: { lte: new Date() },
          status: { in: ["ACTIVE", "ENDED"] },
        },
        orderBy: { endsAt: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          currentPrice: true,
          winnerFirstName: true,
          winnerLastName: true,
          bids: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { bidderId: true },
          },
        },
      }),
    ]);
    auctions = rows;
    categories = distinct.map((d) => d.category).filter(Boolean);
    ended = endedRows.map((a) => ({
      id: a.id,
      title: a.title,
      currentPrice: a.currentPrice,
      winner: resolveAuctionWinner({
        winnerFirstName: a.winnerFirstName,
        winnerLastName: a.winnerLastName,
        bidsAsc: a.bids,
      }).display,
    }));
  } catch (err) {
    db = false;
    console.error("homepage query failed", dbErrorCode(err));
  }

  return (
    <main>
      <SiteHeader
        nav={
          <>
            <a href="#aukce">Aukce</a>
            <a href="#jak">Jak to funguje</a>
          </>
        }
        actions={
          <Link className="btn" href="/aukce/nova">
            ＋ Vložit aukci
          </Link>
        }
      />
      <section className="hero">
        <p className="hero-kicker">DRAŽÍMEEE, POMÁHÁMEEE! 💚</p>
        <h1>Jedna věc může udělat radost hned dvakrát.</h1>
        <div className="hero-copy">
          <p>
            Každý z nás má doma něco, co už nepotřebuje. A právě taková věc
            může získat nový domov a zároveň pomoci dobré věci. Zapojte se do
            naší firemní aukce, nabídněte něco ze svého domova nebo přihazujte
            na předměty ostatních kolegů.
          </p>
          <p className="hero-emph">
            Místo placení původnímu majiteli věnujete vydraženou částku na
            dobročinnou sbírku.
          </p>
          <p>
            Vy získáte něco nového, věci dostanou druhou šanci a společně
            dokážeme pomoci tam, kde je to potřeba.
          </p>
        </div>
        <a className="btn" href="#aukce">
          Prohlédnout aukce
        </a>
      </section>
      <section className="how" id="pomahame" aria-labelledby="pomahame-nadpis">
        <h2 id="pomahame-nadpis">Komu společně pomáháme?</h2>
        <div className="causes">
          <article>
            <h3>Pomoc k léčbě pro Patrička</h3>
            <p>
              Pomozme malému Patričkovi, který bojuje s Duchennovou svalovou
              dystrofií. Příspěvky podpoří jeho léčbu a péči o něj.
            </p>
            <a
              className="cause-link"
              href="https://donio.cz/pomoc-k-lecbe-pro-patricka-s-duchennobou-svalovou-dystrofii"
              target="_blank"
              rel="noopener noreferrer"
            >
              Přejít na sbírku
            </a>
          </article>
          <article>
            <h3>Zachraňte útulek Adoptuj psího parťáka</h3>
            <p>
              Pomozme zachovat bezpečné zázemí pro opuštěné pejsky, kteří
              čekají na svou druhou šanci a milující domov.
            </p>
            <a
              className="cause-link"
              href="https://donio.cz/zachrante-utulek-adoptuj-psiho-partaka-z-s"
              target="_blank"
              rel="noopener noreferrer"
            >
              Přejít na sbírku
            </a>
          </article>
          <article>
            <h3>Za Zdravé Dělohy</h3>
            <p>
              Podpořme osvětu o endometrióze, včasnější diagnostiku a lepší
              dostupnost péče pro ženy, které s tímto onemocněním žijí.
            </p>
            <a
              className="cause-link"
              href="https://www.darujme.cz/zazdravedelohy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Přejít na sbírku
            </a>
          </article>
        </div>
      </section>
      <section id="aukce">
        <p className="eyebrow">PRÁVĚ SE DRAŽÍ</p>
        <h2>Aktuální aukce</h2>

        {db && categories.length > 0 && (
          <div className="cat-filter" role="navigation" aria-label="Filtr kategorií">
            <span className="cat-filter-label">Kategorie:</span>
            <Link
              href="/#aukce"
              className={!selectedCategory ? "cat-chip active" : "cat-chip"}
            >
              Vše
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?kategorie=${encodeURIComponent(c)}#aukce`}
                className={
                  selectedCategory === c ? "cat-chip active" : "cat-chip"
                }
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {!db && (
          <p className="notice">
            Databáze není připojena. Nastavte DATABASE_URL a spusťte migrace.
          </p>
        )}
        {db && auctions.length === 0 && (
          <p>
            {selectedCategory
              ? `V kategorii „${selectedCategory}“ teď nejsou aktivní aukce.`
              : "Zatím tu nejsou aktivní aukce."}
          </p>
        )}
        <div className="grid">
          {auctions.map((a) => {
            const cover = coverImageUrl(a);
            const total =
              (a.images?.length ?? 0) ||
              (a.imageUrls?.length ?? 0) ||
              (a.imageUrl ? 1 : 0);
            const extra = total > 1 ? total - 1 : 0;
            return (
              <article className="card" key={a.id}>
                {cover && (
                  <div className="card-media">
                    <img src={cover} alt={a.title} />
                    {extra > 0 && (
                      <span className="card-media-badge">+{extra} fotek</span>
                    )}
                  </div>
                )}
                <div className="body">
                  <p className="cat-badge">
                    <span className="cat-badge-label">Kategorie</span>
                    <span className="cat-badge-value">{a.category}</span>
                  </p>
                  <p className="card-condition">Stav: {a.condition}</p>
                  <p className="card-condition">
                    Vkládá:{" "}
                    {sellerDisplayName(a.sellerFirstName, a.sellerLastName)}
                  </p>
                  <h3>{a.title}</h3>
                  <strong>{money(a.currentPrice)}</strong>
                  <p>
                    Končí{" "}
                    {a.endsAt.toLocaleString("cs-CZ", {
                      timeZone: "Europe/Prague",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <AuctionCountdown
                    endsAt={a.endsAt.toISOString()}
                    variant="compact"
                  />
                  <Link className="btn secondary" href={`/aukce/${a.id}`}>
                    Zobrazit aukci →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {db && (
        <section id="ukoncene">
          <p className="eyebrow">VÝSLEDKY</p>
          <h2>Ukončené aukce</h2>
          {ended.length === 0 ? (
            <p>Zatím tu nejsou ukončené aukce.</p>
          ) : (
            <div className="grid">
              {ended.map((a) => (
                <article className="card" key={a.id}>
                  <div className="body">
                    <h3>
                      <Link href={`/aukce/${a.id}`}>{a.title}</Link>
                    </h3>
                    <p className="card-condition">Konečná cena</p>
                    <strong>{money(a.currentPrice)}</strong>
                    <p>
                      Vítěz: <strong>{a.winner}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <section id="jak" className="how">
        <h2>Jak to funguje?</h2>
        <div className="steps">
          <article>
            <b>1</b>
            <h3>Vložte předmět</h3>
            <p>
              Máš doma něco navíc? Vyfoť to, přidej popis a stav. Pak už jen
              sleduj příhozy. Vyvolávací cena je u všech předmětů stejná, aby
              se věci opravdu posunuly dále.
            </p>
          </article>
          <article>
            <b>2</b>
            <h3>Přihazuj a pomáhej</h3>
            <p>
              Vyberte si, co se vám líbí, a přihoďte. Nejvyšší nabídka při
              ukončení aukce vyhrává.
            </p>
          </article>
          <article>
            <b>3</b>
            <h3>Přispějte a převezměte si věc</h3>
            <p>
              Výherce pošle částku na vybranou sbírku, doloží potvrzení, které
              dorazí na e-mail a s majitelem se domluví na předání.
            </p>
          </article>
        </div>
      </section>
      <footer>Aukceee na dobrou věc</footer>
    </main>
  );
}
