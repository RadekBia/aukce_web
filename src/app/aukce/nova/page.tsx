import Link from "next/link";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { CreateAuctionForm } from "./create-form";

export default function NewAuction() {
  // Server Component — reads process.env here (not in the client bundle).
  const creationEnabled = isUnauthenticatedAuctionCreationEnabled();

  return (
    <main>
      <header>
        <Link className="brand" href="/">
          Aukceee <span>na dobrou Věc</span>
        </Link>
        <Link href="/" className="btn secondary">
          ← Zpět
        </Link>
      </header>
      <section className="form">
        <p className="eyebrow">PRO PRODÁVAJÍCÍ</p>
        <h1>Vložit novou aukci</h1>
        {creationEnabled ? (
          <CreateAuctionForm />
        ) : (
          <>
            <p>
              Formulář je vypnutý. Pro lokální testování nastavte v{" "}
              <code>.env</code> (a restartujte <code>npm run dev</code>):
            </p>
            <pre className="env-snippet">
              ENABLE_UNAUTHENTICATED_AUCTION_CREATION=&quot;true&quot;
            </pre>
            <p className="notice bid-warn">
              Použijte větev z draft PR #1 (ne starý <code>main</code>). V
              produkci / sdíleném prostředí nechte vypnuté — kdokoli by mohl
              vytvářet aukce bez přihlášení.
            </p>
            <Link className="btn" href="/">
              Zpět na přehled aukcí
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
