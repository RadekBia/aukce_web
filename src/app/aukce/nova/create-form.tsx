"use client";

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

export function CreateAuctionForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const imageRaw = String(fd.get("imageUrl") ?? "").trim();
    const startingPrice = Number(fd.get("startingPrice"));
    const durationHours = Number(fd.get("durationHours"));

    const body = {
      title: String(fd.get("title") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      category: String(fd.get("category") ?? "").trim(),
      condition: String(fd.get("condition") ?? "").trim(),
      imageUrl: imageRaw,
      startingPrice,
      durationHours,
    };

    setPending(true);
    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Aukci se nepodařilo vytvořit.",
        );
        return;
      }
      router.push(`/aukce/${data.auction.id}`);
      router.refresh();
    } catch {
      setError("Síťová chyba při vytváření aukce.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="create-form" onSubmit={onSubmit}>
      <p className="notice bid-warn">
        Lokální režim: vytváření bez přihlášení je zapnuté přes{" "}
        <code>ENABLE_UNAUTHENTICATED_AUCTION_CREATION=true</code>. V produkci /
        sdíleném prostředí nechte vypnuté.
      </p>

      <label>
        Název
        <input name="title" required minLength={3} maxLength={120} />
      </label>
      <label>
        Popis
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={10000}
          rows={5}
        />
      </label>
      <div className="create-row">
        <label>
          Kategorie
          <select name="category" required defaultValue={CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stav
          <select name="condition" required defaultValue={CONDITIONS[2]}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        URL obrázku (volitelné)
        <input
          name="imageUrl"
          type="url"
          placeholder="https://…"
          autoComplete="off"
        />
      </label>
      <div className="create-row">
        <label>
          Vyvolávací cena (Kč)
          <input
            name="startingPrice"
            type="number"
            inputMode="numeric"
            required
            min={1}
            step={1}
            defaultValue={100}
          />
        </label>
        <label>
          Délka (hodiny)
          <input
            name="durationHours"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={720}
            step={1}
            defaultValue={48}
          />
        </label>
      </div>

      {error && <p className="bid-error">{error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Ukládám…" : "Vytvořit aukci"}
      </button>
    </form>
  );
}
