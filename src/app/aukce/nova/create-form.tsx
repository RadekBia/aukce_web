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

export function CreateAuctionForm({
  blobConfigured,
}: {
  blobConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const imageRaw = String(fd.get("imageUrl") ?? "").trim();
    const file = fd.get("imageFile");
    const startingPrice = Number(fd.get("startingPrice"));
    const durationHours = Number(fd.get("durationHours"));

    setPending(true);
    try {
      let imageUrl = imageRaw;

      if (file instanceof File && file.size > 0) {
        const uploadFd = new FormData();
        uploadFd.set("file", file);
        const up = await fetch("/api/uploads", {
          method: "POST",
          body: uploadFd,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) {
          setError(
            typeof upData.error === "string"
              ? upData.error
              : "Nahrání fotky selhalo.",
          );
          return;
        }
        if (typeof upData.url === "string") imageUrl = upData.url;
      }

      const body = {
        title: String(fd.get("title") ?? "").trim(),
        description: String(fd.get("description") ?? "").trim(),
        category: String(fd.get("category") ?? "").trim(),
        condition: String(fd.get("condition") ?? "").trim(),
        imageUrl,
        startingPrice,
        durationHours,
      };

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
        Vytváření aukcí je dočasně otevřené bez přihlášení (do Google SSO).
        Kdokoli s odkazem může přidat položku — po SSO se formulář znovu
        zamkne.
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
        Fotka (soubor)
        <input
          name="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={!blobConfigured || pending}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f ? f.name : null);
          }}
        />
      </label>
      {blobConfigured ? (
        <p className="bid-hint">
          {fileName
            ? `Vybráno: ${fileName}`
            : "Soubor se nahraje do Vercel Blob a uloží jako veřejná URL."}
        </p>
      ) : (
        <p className="notice bid-warn">
          Nahrávání souborů zatím není připojené. Ve Vercelu:{" "}
          <strong>Storage → Blob</strong> → připojit k tomuto projektu (token
          se doplní automaticky). Do té doby použijte URL níže.
        </p>
      )}

      <label>
        Nebo URL obrázku (volitelné)
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
