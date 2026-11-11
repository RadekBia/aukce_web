"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  BROWSER_MAX_ORIGINAL_BYTES,
  compressImageInBrowser,
} from "@/lib/browser-compress";
import {
  AUCTION_ENDS_LABEL_CS,
  AUCTION_STARTING_PRICE,
} from "@/lib/auction-rules";

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

    if (fileList.length > MAX_FILES) {
      setError(`Najednou lze nahrát nejvýše ${MAX_FILES} příloh.`);
      return;
    }

    setPending(true);
    try {
      const imageIds: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const original = fileList[i]!;
        let compressed: File;
        try {
          compressed = await compressImageInBrowser(original);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Komprese fotky selhala.",
          );
          return;
        }

        const uploadFd = new FormData();
        uploadFd.set("file", compressed);
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
        sellerFirstName: String(fd.get("sellerFirstName") ?? "").trim(),
        sellerLastName: String(fd.get("sellerLastName") ?? "").trim(),
        imageIds,
        imageUrl: imageIds.length === 0 ? imageRaw : "",
        imageUrls: imageIds.length === 0 && imageRaw ? [imageRaw] : [],
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
      <div className="create-row">
        <label>
          Jméno
          <input
            name="sellerFirstName"
            required
            minLength={1}
            maxLength={40}
            autoComplete="given-name"
          />
        </label>
        <label>
          Příjmení
          <input
            name="sellerLastName"
            required
            minLength={1}
            maxLength={40}
            autoComplete="family-name"
          />
        </label>
      </div>

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

      <fieldset className="create-category">
        <legend>Kategorie</legend>
        <p className="bid-hint">
          Vyberte, kam aukce patří — kategorie se zobrazí na přehledu i v
          detailu.
        </p>
        <label>
          Kategorie aukce
          <select name="category" required defaultValue={CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stav předmětu
          <select name="condition" required defaultValue={CONDITIONS[2]}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="create-attachments">
        <legend>Přílohy — fotky z počítače</legend>
        <p className="bid-hint">
          1–{MAX_FILES} souborů (JPEG, PNG nebo WebP), každý až{" "}
          <strong>20&nbsp;MB</strong>. Fotka se automaticky zkomprimuje
          (bez omezení rozměrů v pixelech).
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
              const tooBig = list.find(
                (f) => f.size > BROWSER_MAX_ORIGINAL_BYTES,
              );
              if (tooBig) {
                setError(
                  `Soubor „${tooBig.name}“ je větší než 20 MB. Vyberte menší fotku.`,
                );
              } else {
                setError(null);
              }
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
          URL obrázku (volitelné)
          <input
            name="imageUrl"
            type="url"
            placeholder="https://…"
            autoComplete="off"
          />
        </label>
      )}

      <p className="bid-hint">
        Vyvolávací cena: <strong>{AUCTION_STARTING_PRICE}&nbsp;Kč</strong>.
        Konec aukce: <strong>{AUCTION_ENDS_LABEL_CS}</strong> (nelze změnit).
      </p>

      {error && <p className="bid-error">{error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Ukládám…" : "Vytvořit aukci"}
      </button>
    </form>
  );
}
