import Link from "next/link";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { CreateAuctionForm } from "./create-form";

export const dynamic = "force-dynamic";

export default function NewAuction() {
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
              Formulář je vypnutý (
              <code>ENABLE_UNAUTHENTICATED_AUCTION_CREATION=false</code> nebo
              po zavedení přihlášení).
            </p>
            <p className="notice bid-warn">
              Po Google SSO bude vytváření jen pro přihlášené uživatele.
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
