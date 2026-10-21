import Link from "next/link";
import { CreateAuctionForm } from "./create-form";

export default function NewAuction() {
  const creationEnabled =
    process.env.ENABLE_UNAUTHENTICATED_AUCTION_CREATION === "true";

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
              <code>.env</code>:
            </p>
            <pre className="env-snippet">
              ENABLE_UNAUTHENTICATED_AUCTION_CREATION=&quot;true&quot;
            </pre>
            <p className="notice bid-warn">
              Nezapínejte v produkci ani ve sdíleném prostředí — kdokoli by mohl
              vytvářet aukce bez přihlášení. Google SSO přijde později.
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
