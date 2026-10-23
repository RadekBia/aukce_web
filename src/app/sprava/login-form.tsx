"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError(
        "Administrace není nastavená. Na Vercelu přidejte ADMIN_SECRET a znovu nasaďte aplikaci.",
      );
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Přihlášení selhalo.",
        );
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setError("Síťová chyba při přihlášení.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="create-form" onSubmit={onSubmit}>
      <p className="notice bid-warn">
        Heslo je hodnota <code>ADMIN_SECRET</code> z Vercelu.
      </p>
      {!configured && (
        <p className="bid-error">
          Mazání je vypnuté: chybí env <code>ADMIN_SECRET</code>.
        </p>
      )}
      <label>
        Administrátorské heslo
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={1}
          disabled={!configured || pending}
        />
      </label>
      {error && <p className="bid-error">{error}</p>}
      <button className="btn" type="submit" disabled={!configured || pending}>
        {pending ? "Přihlašuji…" : "Přihlásit"}
      </button>
    </form>
  );
}
