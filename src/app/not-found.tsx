import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
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
        <p className="eyebrow">404</p>
        <h1>Aukce nenalezena</h1>
        <p>Tato aukce neexistuje, nebo byla odstraněna.</p>
        <Link className="btn" href="/">
          Zpět na přehled aukcí
        </Link>
      </section>
    </main>
  );
}
