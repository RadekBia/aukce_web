"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  title: string;
  status: string;
  currentPrice: number;
  endsAt: string;
  bidCount: number;
};

type BidLogRow = {
  id: string;
  amount: number;
  bidderId: string;
  createdAt: string;
  auctionId: string;
  auctionTitle: string;
};

const money = (n: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);

export function AdminPanel({
  auctions,
  bids,
  saved,
}: {
  auctions: Row[];
  bids: BidLogRow[];
  saved?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function removeAuction(row: Row) {
    const ok = window.confirm(
      `Opravdu smazat aukci „${row.title}“ včetně všech příhozů? Tuto akci nelze vrátit.`,
    );
    if (!ok) return;
    setError(null);
    setPendingId(row.id);
    try {
      const res = await fetch(`/api/admin/auctions/${row.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Smazání selhalo.",
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Síťová chyba při mazání.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <p className="bid-hint">
          Přihlášeni jako administrátor (cookie, 12 h). Mazání jen zde — veřejný
          katalog tlačítko Smazat nemá.
        </p>
        <button type="button" className="btn secondary" onClick={logout}>
          Odhlásit
        </button>
      </div>

      {saved && (
        <p className="bid-ok">Aukce byla úspěšně uložena.</p>
      )}
      {error && <p className="bid-error">{error}</p>}

      <h2 className="admin-section-title">Aukce</h2>
      {auctions.length === 0 ? (
        <p>Žádné aukce v databázi.</p>
      ) : (
        <ul className="admin-list">
          {auctions.map((a) => (
            <li key={a.id}>
              <div className="admin-list-main">
                <strong>{a.title}</strong>
                <span>
                  {a.status} · {money(a.currentPrice)} · {a.bidCount} příhozů ·
                  končí{" "}
                  {new Date(a.endsAt).toLocaleString("cs-CZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="admin-list-actions">
                <Link className="btn secondary" href={`/aukce/${a.id}`}>
                  Zobrazit
                </Link>
                <Link className="btn secondary" href={`/sprava/${a.id}`}>
                  Upravit
                </Link>
                <button
                  type="button"
                  className="btn danger"
                  disabled={pendingId === a.id}
                  onClick={() => removeAuction(a)}
                >
                  {pendingId === a.id ? "Mažu…" : "Smazat"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="admin-section-title">Protokol příhozů</h2>
      <p className="bid-hint">
        Nejnovější příhozy napříč všemi aukcemi (čas, aukce, přihazující,
        částka).
      </p>
      {bids.length === 0 ? (
        <p>Zatím žádné příhozy.</p>
      ) : (
        <ul className="admin-bid-log">
          {bids.map((b) => (
            <li key={b.id}>
              <time dateTime={b.createdAt}>
                {new Date(b.createdAt).toLocaleString("cs-CZ", {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </time>
              <Link href={`/aukce/${b.auctionId}`}>{b.auctionTitle}</Link>
              <span className="admin-bid-bidder">{b.bidderId}</span>
              <strong>{money(b.amount)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
