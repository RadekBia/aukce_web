import Link from "next/link";

export default function NotFound() {
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
