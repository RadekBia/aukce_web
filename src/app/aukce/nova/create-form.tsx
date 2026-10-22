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
const MAX_FILES = 5;

export function CreateAuctionForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const imageRaw = String(fd.get("imageUrl") ?? "").trim();
    const fileList = fd
      .getAll("imageFiles")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const startingPrice = Number(fd.get("startingPrice"));
    const durationHours = Number(fd.get("durationHours"));

    if (fileList.length > MAX_FILES) {
      setError(`Najednou lze nahrát nejvýše ${MAX_FILES} příloh.`);
      return;
    }

    setPending(true);
    try {
      const imageIds: string[] = [];

      // One request per file (~2 MB) — stays under serverless body limits.
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]!;
        const uploadFd = new FormData();
        uploadFd.set("file", file);
        uploadFd.set("sortOrder", String(i));
        const up = await fetch("/api/uploads", {
          method: "POST",
          body: uploadFd,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) {
          setError(
            typeof upData.error === "string"
              ? upData.error
              : "Nahrání příloh selhalo.",
          );
          return;
        }
        if (typeof upData.id === "string") imageIds.push(upData.id);
      }

      const body = {
        title: String(fd.get("title") ?? "").trim(),
        description: String(fd.get("description") ?? "").trim(),
        category: String(fd.get("category") ?? "").trim(),
        condition: String(fd.get("condition") ?? "").trim(),
        imageIds,
        imageUrl: imageIds.length === 0 ? imageRaw : "",
        imageUrls: imageIds.length === 0 && imageRaw ? [imageRaw] : [],
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
        Fotky se ukládají do Neon databáze (ne Vercel Blob).
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

      <fieldset className="create-attachments">
        <legend>Přílohy — fotky z počítače</legend>
        <p className="bid-hint">
          1–{MAX_FILES} souborů (JPEG, PNG nebo WebP). Fotky se{" "}
          <strong>automaticky zmenší a zkomprimují</strong> na serveru (nejdelší
          strana max. 1600&nbsp;px, WebP kvalita 80) a uloží do Neon. Po
          kompresi max. 2&nbsp;MB na fotku.
        </p>
        <label className="file-picker">
          <span className="btn secondary file-picker-btn">
            Vybrat fotky z počítače…
          </span>
          <input
            name="imageFiles"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={pending}
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              setSelectedNames(list.map((f) => f.name));
            }}
          />
        </label>
        {selectedNames.length > 0 ? (
          <ul className="file-name-list">
            {selectedNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : (
          <p className="bid-hint">Zatím žádné soubory.</p>
        )}
      </fieldset>

      <button
        type="button"
        className="linkish"
        onClick={() => setShowUrlFallback((v) => !v)}
      >
        {showUrlFallback
          ? "Skrýt záložní URL obrázku"
          : "Záložní možnost: vložit URL obrázku"}
      </button>
      {showUrlFallback && (
        <label>
          URL obrázku (volitelné — neukládá se jako soubor v DB)
          <input
            name="imageUrl"
            type="url"
            placeholder="https://…"
            autoComplete="off"
          />
        </label>
      )}

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
