import Link from "next/link";
import { auth, signIn } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { isAuthConfigured } from "@/lib/auth-env";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { CreateAuctionForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewAuction() {
  const allowAnon = isUnauthenticatedAuctionCreationEnabled();
  const configured = isAuthConfigured();
  const session = configured ? await auth() : null;
  const canCreate = Boolean(session?.user) || allowAnon;

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
        {canCreate ? (
          <CreateAuctionForm />
        ) : !configured ? (
          <>
            <p className="bid-error">
              Přihlášení přes Google není nastavené — na Vercelu chybí{" "}
              <code>AUTH_GOOGLE_ID</code>, <code>AUTH_GOOGLE_SECRET</code>,{" "}
              <code>AUTH_SECRET</code> a <code>AUTH_URL</code>.
            </p>
            <Link className="btn" href="/">
              Zpět na přehled aukcí
            </Link>
          </>
        ) : (
          <>
            <p className="notice bid-warn">
              Pro vytvoření aukce se musíte přihlásit přes Google.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/aukce/nova" });
              }}
            >
              <button type="submit" className="btn">
                Přihlásit se přes Google
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
