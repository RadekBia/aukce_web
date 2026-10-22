import Link from "next/link";
import { coverImageUrl } from "@/lib/auction-images";
import { prisma } from "@/lib/prisma";

// Always query Neon at request time — avoid build-time prerender with an empty DB.
export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);

export default async function Home() {
  let auctions = [] as Awaited<ReturnType<typeof prisma.auction.findMany>>;
  let db = true;
  try {
    auctions = await prisma.auction.findMany({
      where: { status: "ACTIVE", endsAt: { gt: new Date() } },
      orderBy: { endsAt: "asc" },
      take: 40,
    });
  } catch {
    db = false;
  }

  return (
    <main>
      <header>
        <Link className="brand" href="/">
          Aukceee <span>na dobrou Věc</span>
        </Link>
        <nav>
          <a href="#aukce">Aukce</a>
          <a href="#jak">Jak to funguje</a>
        </nav>
        <Link className="btn" href="/aukce/nova">
          ＋ Vložit aukci
        </Link>
      </header>
      <section className="hero">
        <p>DEJTE VĚCEM DRUHOU ŠANCI</p>
        <h1>
          Co už nepotřebujete,
          <br />
          může někomu udělat radost.
        </h1>
        <div>
          Jednoduché aukce použitých věcí. Prodávejte, přihazujte a objevujte
          výhodné úlovky.
        </div>
        <a className="btn" href="#aukce">
          Prohlédnout aukce
        </a>
      </section>
      <section id="aukce">
        <p className="eyebrow">PRÁVĚ SE DRAŽÍ</p>
        <h2>Aktuální aukce</h2>
        {!db && (
          <p className="notice">
            Databáze není připojena. Nastavte DATABASE_URL a spusťte migrace.
          </p>
        )}
        {db && auctions.length === 0 && (
          <p>Zatím tu nejsou aktivní aukce. Spusťte seed podle README.</p>
        )}
        <div className="grid">
          {auctions.map((a) => {
            const cover = coverImageUrl(a);
            const extra =
              (a.imageUrls?.length ?? 0) > 1
                ? a.imageUrls!.length - 1
                : 0;
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
                  <small>
                    {a.category} · {a.condition}
                  </small>
                  <h3>{a.title}</h3>
                  <strong>{money(a.currentPrice)}</strong>
                  <p>Končí {a.endsAt.toLocaleDateString("cs-CZ")}</p>
                  <Link className="btn secondary" href={`/aukce/${a.id}`}>
                    Zobrazit aukci →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section id="jak" className="how">
        <h2>Jak to funguje?</h2>
        <div className="steps">
          <article>
            <b>1</b>
            <h3>Vložte předmět</h3>
            <p>Přidejte fotku, popis a vyvolávací cenu.</p>
          </article>
          <article>
            <b>2</b>
            <h3>Přihazujte</h3>
            <p>Najděte zajímavou věc a nabídněte svou cenu.</p>
          </article>
          <article>
            <b>3</b>
            <h3>Domluvte se</h3>
            <p>
              Po skončení aukce se prodávající a vítěz domluví na předání.
            </p>
          </article>
        </div>
      </section>
      <footer>Aukceee na dobrou Věc · První funkční základ</footer>
    </main>
  );
}
