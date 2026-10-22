"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const CATEGORIES = [
  "Domácnost",
  "Elektronika",
  "Sport a hobby",
  "Oblečení",
  "Nábytek",
  "Ostatní",
];

const CONDITIONS = ["Nový", "Velmi dobrý", "Dobrý", "Použitý", "Na opravu"];

const STATUSES: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Koncept" },
  { value: "ACTIVE", label: "Aktivní" },
  { value: "ENDED", label: "Ukončená" },
  { value: "CANCELLED", label: "Zrušená" },
];

export type EditAuctionData = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  endsAt: string;
  bidCount: number;
  photoCount: number;
};

/** Format ISO date for `<input type="datetime-local">` in local timezone. */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminEditForm({ auction }: { auction: EditAuctionData }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasBids = auction.bidCount > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const endsLocal = String(fd.get("endsAt") ?? "").trim();
    const endsAt = new Date(endsLocal);
    if (!endsLocal || Number.isNaN(endsAt.getTime())) {
      setError("Zadejte platný termín ukončení.");
      return;
    }

    const startingPrice = Number(fd.get("startingPrice"));
    if (!hasBids) {
      if (!Number.isInteger(startingPrice) || startingPrice < 1) {
        setError("Vyvolávací cena musí být celé kladné číslo.");
        return;
      }
    }

    const body: Record<string, unknown> = {
      title: String(fd.get("title") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      category: String(fd.get("category") ?? "").trim(),
      condition: String(fd.get("condition") ?? "").trim(),
      status: String(fd.get("status") ?? "").trim(),
      endsAt: endsAt.toISOString(),
    };
    if (!hasBids) {
      body.startingPrice = startingPrice;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/admin/auctions/${auction.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Uložení aukce selhalo.",
        );
        return;
      }
      router.push("/sprava?ulozeno=1");
      router.refresh();
    } catch {
      setError("Síťová chyba při ukládání.");
    } finally {
      setPending(false);
    }
  }

  const categoryOptions = CATEGORIES.includes(auction.category)
    ? CATEGORIES
    : [auction.category, ...CATEGORIES];
  const conditionOptions = CONDITIONS.includes(auction.condition)
    ? CONDITIONS
    : [auction.condition, ...CONDITIONS];

  return (
    <form className="create-form" onSubmit={onSubmit}>
      <p className="notice">
        Úprava existující aukce. Příhozy zůstávají. Fotky se nemění — textová
        pole lze uložit bez nového nahrání.
      </p>

      <label>
        Název
        <input
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={auction.title}
        />
      </label>
      <label>
        Popis
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={10000}
          rows={5}
          defaultValue={auction.description}
        />
      </label>

      <fieldset className="create-category">
        <legend>Kategorie a stav</legend>
        <label>
          Kategorie aukce
          <select name="category" required defaultValue={auction.category}>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stav předmětu
          <select name="condition" required defaultValue={auction.condition}>
            {conditionOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="create-row">
        <label>
          Stav aukce
          <select name="status" required defaultValue={auction.status}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Konec aukce
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(auction.endsAt)}
          />
        </label>
      </div>

      <div className="create-row">
        <label>
          Vyvolávací cena (Kč)
          {hasBids ? (
            <>
              <input
                type="number"
                value={auction.startingPrice}
                readOnly
                disabled
                aria-readonly="true"
              />
              <span className="bid-hint">
                Nelze měnit — aukce má {auction.bidCount} příhozů. Aktuální cena{" "}
                {auction.currentPrice} Kč zůstává.
              </span>
            </>
          ) : (
            <input
              name="startingPrice"
              type="number"
              inputMode="numeric"
              required
              min={1}
              step={1}
              defaultValue={auction.startingPrice}
            />
          )}
        </label>
        <label>
          Aktuální cena (Kč)
          <input
            type="number"
            value={auction.currentPrice}
            readOnly
            disabled
            aria-readonly="true"
          />
          <span className="bid-hint">
            {hasBids
              ? "Určena příhozy — při uložení se nemění."
              : "Bez příhozů se při změně vyvolávací ceny sjednotí."}
          </span>
        </label>
      </div>

      <fieldset className="create-attachments">
        <legend>Fotky</legend>
        <p className="bid-hint">
          {auction.photoCount > 0
            ? `Uloženo ${auction.photoCount} fotek v Neon — zůstávají beze změny.`
            : "Žádné fotky v databázi. Úprava textových polí fotky nevyžaduje."}
        </p>
      </fieldset>

      {error && <p className="bid-error">{error}</p>}

      <div className="admin-edit-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Ukládám…" : "Uložit změny"}
        </button>
        <Link className="btn secondary" href="/sprava">
          Zpět na seznam
        </Link>
      </div>
    </form>
  );
}
