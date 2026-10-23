"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  resultingPrice: number;
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
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftRaises, setDraftRaises] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const b of bids) next[b.id] = String(b.amount);
    setDraftRaises(next);
  }, [bids]);

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
    setOkMsg(null);
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

  async function saveBidRaise(row: BidLogRow) {
    setError(null);
    setOkMsg(null);
    const raw = (draftRaises[row.id] ?? "").trim();
    if (raw === "") {
      setError("Navýšení nesmí být prázdné.");
      return;
    }
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < 1) {
      setError(
        "Navýšení musí být celé číslo alespoň 1 Kč (ne nula ani záporné).",
      );
      return;
    }
    setPendingId(row.id);
    try {
      const res = await fetch(`/api/admin/bids/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Uložení příhozu selhalo.",
        );
        return;
      }
      setOkMsg(
        `Navýšení uloženo (+${money(amount)}). Aktuální cena aukce: ${money(data.auction.currentPrice)}.`,
      );
      router.refresh();
    } catch {
      setError("Síťová chyba při ukládání příhozu.");
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
      {okMsg && <p className="bid-ok">{okMsg}</p>}
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
        Upravte navýšení (Kč, celé číslo ≥ 1). Po uložení se přepočítá běžící
        součet a aktuální cena aukce (vyvolávací + příhozy v čase). Veřejné
        minimum 10 Kč zde neplatí.
      </p>
      {bids.length === 0 ? (
        <p>Zatím žádné příhozy.</p>
      ) : (
        <ul className="admin-bid-log">
          {bids.map((b) => {
            const draft = draftRaises[b.id] ?? String(b.amount);
            const draftNum = Number(draft);
            const previewResult =
              Number.isInteger(draftNum) && draftNum >= 1
                ? b.resultingPrice - b.amount + draftNum
                : null;
            const dirty =
              draft.trim() !== "" && Number(draft) !== b.amount;
            return (
              <li key={b.id} className="admin-bid-log-edit">
                <time dateTime={b.createdAt}>
                  {new Date(b.createdAt).toLocaleString("cs-CZ", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </time>
                <Link href={`/aukce/${b.auctionId}`}>{b.auctionTitle}</Link>
                <span className="admin-bid-bidder">{b.bidderId}</span>
                <label className="admin-bid-raise">
                  <span>Navýšení (Kč)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={draft}
                    disabled={pendingId === b.id}
                    onChange={(e) =>
                      setDraftRaises((prev) => ({
                        ...prev,
                        [b.id]: e.target.value,
                      }))
                    }
                  />
                </label>
                <span className="admin-bid-result">
                  →{" "}
                  {previewResult !== null
                    ? money(previewResult)
                    : money(b.resultingPrice)}
                </span>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={pendingId === b.id || !dirty}
                  onClick={() => saveBidRaise(b)}
                >
                  {pendingId === b.id ? "Ukládám…" : "Uložit"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
