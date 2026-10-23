import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { CreateAuctionForm } from "./create-form";

export const dynamic = "force-dynamic";

export default function NewAuction() {
  const creationEnabled = isUnauthenticatedAuctionCreationEnabled();

  return (
    <main>
      <SiteHeader
        actions={
          <Link href="/" className="btn secondary">
            ← Zpět
          </Link>
        }
      />
      <section className="form">
        <p className="eyebrow">PRO PRODÁVAJÍCÍ</p>
        <h1>Vložit novou aukci</h1>
        {creationEnabled ? (
          <CreateAuctionForm />
        ) : (
          <>
            <p>
              Formulář je vypnutý (
              <code>ENABLE_UNAUTHENTICATED_AUCTION_CREATION=false</code>).
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
