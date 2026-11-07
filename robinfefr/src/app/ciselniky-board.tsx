"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CatalogKey = "zbozi" | "umisteni" | "ucet";

type Catalog = Record<CatalogKey, string[]>;

type Assignment = {
  id: string;
  zbozi: string;
  umisteni: string;
  ucet: string;
  note: string;
};

type Store = {
  catalog: Catalog;
  rows: Assignment[];
};

const STORAGE_KEY = "aukce.ciselniky.v2";

const CATALOG_LABEL: Record<CatalogKey, string> = {
  zbozi: "Zboží",
  umisteni: "Umístění",
  ucet: "Účet",
};

const SEED: Store = {
  catalog: {
    zbozi: ["Roleta den a noc", "Horizontální žaluzie", "Plisé", "Síť proti hmyzu"],
    umisteni: ["Sklad Ostrava", "Sklad Praha", "Montážní vůz 1", "Showroom"],
    ucet: ["Pokladna", "Banka Fio", "Zálohy zákazníků", "Hotovost u technika"],
  },
  rows: [
    {
      id: "r1",
      zbozi: "Roleta den a noc",
      umisteni: "Sklad Ostrava",
      ucet: "Pokladna",
      note: "",
    },
    {
      id: "r2",
      zbozi: "Horizontální žaluzie",
      umisteni: "Sklad Praha",
      ucet: "Banka Fio",
      note: "",
    },
    {
      id: "r3",
      zbozi: "Plisé",
      umisteni: "Showroom",
      ucet: "Zálohy zákazníků",
      note: "",
    },
    {
      id: "r4",
      zbozi: "Síť proti hmyzu",
      umisteni: "Montážní vůz 1",
      ucet: "Hotovost u technika",
      note: "",
    },
  ],
};

function isCatalog(value: unknown): value is Catalog {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return (["zbozi", "umisteni", "ucet"] as const).every(
    (key) =>
      Array.isArray(raw[key]) &&
      raw[key].every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 80),
  );
}

function isAssignment(value: unknown): value is Assignment {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    typeof row.zbozi === "string" &&
    row.zbozi.trim().length > 0 &&
    row.zbozi.length <= 80 &&
    typeof row.umisteni === "string" &&
    row.umisteni.trim().length > 0 &&
    row.umisteni.length <= 80 &&
    typeof row.ucet === "string" &&
    row.ucet.trim().length > 0 &&
    row.ucet.length <= 80 &&
    (row.note === undefined || (typeof row.note === "string" && row.note.length <= 200))
  );
}

function parseStore(value: unknown): Store | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!isCatalog(raw.catalog) || !Array.isArray(raw.rows) || !raw.rows.every(isAssignment)) {
    return null;
  }
  const catalog: Catalog = {
    zbozi: uniqueNames(raw.catalog.zbozi),
    umisteni: uniqueNames(raw.catalog.umisteni),
    ucet: uniqueNames(raw.catalog.ucet),
  };
  const rows = raw.rows.map((row) => ({
    id: row.id,
    zbozi: row.zbozi.trim(),
    umisteni: row.umisteni.trim(),
    ucet: row.ucet.trim(),
    note: (row.note ?? "").trim(),
  }));
  for (const row of rows) {
    catalog.zbozi = uniqueNames([...catalog.zbozi, row.zbozi]);
    catalog.umisteni = uniqueNames([...catalog.umisteni, row.umisteni]);
    catalog.ucet = uniqueNames([...catalog.ucet, row.ucet]);
  }
  return { catalog, rows };
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    const key = trimmed.toLocaleLowerCase("cs");
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return parseStore(JSON.parse(raw)) ?? SEED;
  } catch {
    return SEED;
  }
}

function withCatalog(catalog: Catalog, key: CatalogKey, name: string): Catalog {
  return { ...catalog, [key]: uniqueNames([...catalog[key], name]) };
}

export function CiselnikyApp({ signedIn: initialSignedIn }: { signedIn: boolean }) {
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);

  const [store, setStore] = useState<Store>(SEED);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState({ zbozi: "", umisteni: "", ucet: "", note: "" });
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ zbozi: "", umisteni: "", ucet: "", note: "" });
  const [catalogDraft, setCatalogDraft] = useState<Record<CatalogKey, string>>({
    zbozi: "",
    umisteni: "",
    ucet: "",
  });
  const [undo, setUndo] = useState<{ row: Assignment; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, ready]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("cs");
    if (!q) return store.rows;
    return store.rows.filter((row) =>
      `${row.zbozi} ${row.umisteni} ${row.ucet} ${row.note}`.toLocaleLowerCase("cs").includes(q),
    );
  }, [store.rows, query]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoginPending(true);
    try {
      const res = await fetch("/api/ciselniky/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(typeof data.error === "string" ? data.error : "Přihlášení selhalo.");
        return;
      }
      setPassword("");
      setSignedIn(true);
    } catch {
      setLoginError("Síťová chyba při přihlášení.");
    } finally {
      setLoginPending(false);
    }
  }

  async function logout() {
    await fetch("/api/ciselniky/logout", { method: "POST" });
    setSignedIn(false);
    setEmail("");
    setPassword("");
  }

  function addRow(event: React.FormEvent) {
    event.preventDefault();
    const zbozi = draft.zbozi.trim();
    const umisteni = draft.umisteni.trim();
    const ucet = draft.ucet.trim();
    const note = draft.note.trim();
    if (!zbozi || !umisteni || !ucet) {
      setFormError("Vyplňte zboží, umístění i účet. Nový název se sám přidá do číselníku.");
      return;
    }
    const row: Assignment = { id: crypto.randomUUID(), zbozi, umisteni, ucet, note };
    setStore((prev) => ({
      catalog: {
        zbozi: uniqueNames([...prev.catalog.zbozi, zbozi]),
        umisteni: uniqueNames([...prev.catalog.umisteni, umisteni]),
        ucet: uniqueNames([...prev.catalog.ucet, ucet]),
      },
      rows: [row, ...prev.rows],
    }));
    setDraft({ zbozi: "", umisteni: "", ucet: "", note: "" });
    setFormError("");
  }

  function startEdit(row: Assignment) {
    setEditingId(row.id);
    setEditDraft({ zbozi: row.zbozi, umisteni: row.umisteni, ucet: row.ucet, note: row.note });
    setFormError("");
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    const zbozi = editDraft.zbozi.trim();
    const umisteni = editDraft.umisteni.trim();
    const ucet = editDraft.ucet.trim();
    const note = editDraft.note.trim();
    if (!zbozi || !umisteni || !ucet) {
      setFormError("U úpravy vyplňte zboží, umístění i účet.");
      return;
    }
    const next: Assignment = { id: editingId, zbozi, umisteni, ucet, note };
    setStore((prev) => ({
      catalog: {
        zbozi: uniqueNames([...prev.catalog.zbozi, zbozi]),
        umisteni: uniqueNames([...prev.catalog.umisteni, umisteni]),
        ucet: uniqueNames([...prev.catalog.ucet, ucet]),
      },
      rows: prev.rows.map((row) => (row.id === editingId ? next : row)),
    }));
    setEditingId(null);
    setFormError("");
  }

  function removeRow(row: Assignment) {
    const index = store.rows.findIndex((item) => item.id === row.id);
    setStore((prev) => ({
      ...prev,
      rows: prev.rows.filter((item) => item.id !== row.id),
    }));
    if (editingId === row.id) setEditingId(null);
    setUndo({ row, index: Math.max(index, 0) });
  }

  function restoreUndo() {
    if (!undo) return;
    setStore((prev) => {
      const rows = [...prev.rows];
      rows.splice(Math.min(undo.index, rows.length), 0, undo.row);
      return { ...prev, rows };
    });
    setUndo(null);
  }

  function addCatalogName(key: CatalogKey) {
    const name = catalogDraft[key].trim();
    if (!name) return;
    setStore((prev) => ({ ...prev, catalog: withCatalog(prev.catalog, key, name) }));
    setCatalogDraft((prev) => ({ ...prev, [key]: "" }));
  }

  function exportStore() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ciselniky.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importStore(file: File) {
    try {
      const parsed = parseStore(JSON.parse(await file.text()));
      if (!parsed) {
        window.alert("Soubor musí obsahovat katalog a záznamy zboží, umístění a účtu.");
        return;
      }
      setStore(parsed);
      setEditingId(null);
      setUndo(null);
    } catch {
      window.alert("Soubor se nepodařilo přečíst. Očekává se JSON export z této stránky.");
    }
  }

  if (!signedIn) {
    return (
      <div className="cn-app">
        <div className="cn-wrap cn-login-wrap">
          <div className="cn-panel cn-login">
            <p className="cn-kicker">ČÍSELNÍKY</p>
            <h1>Přihlášení</h1>
            <p className="cn-lead">
              Zadejte e-mail a heslo. Pak uvidíte, jaké zboží je na jakém umístění a na jakém
              účtu.
            </p>
            <form className="cn-login-form" onSubmit={login}>
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Heslo
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {loginError ? <p className="cn-error">{loginError}</p> : null}
              <button className="cn-btn cn-btn-primary" type="submit" disabled={loginPending}>
                {loginPending ? "Přihlašuji…" : "Přihlásit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cn-app">
      <div className="cn-wrap">
        <div className="cn-top">
          <div>
            <p className="cn-kicker">ČÍSELNÍKY</p>
            <h1>Zboží na umístění a účtu</h1>
            <p className="cn-lead">
              Jeden záznam = jaké zboží, kde leží a na jakém účtu. Nový název v poli se přidá do
              číselníku.
            </p>
          </div>
          <div className="cn-actions">
            <button type="button" className="cn-btn" onClick={exportStore}>
              Export
            </button>
            <button type="button" className="cn-btn" onClick={() => fileRef.current?.click()}>
              Import
            </button>
            <input
              ref={fileRef}
              className="cn-file"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void importStore(file);
              }}
            />
            <button type="button" className="cn-btn" onClick={() => void logout()}>
              Odhlásit
            </button>
          </div>
        </div>

        <form className="cn-panel cn-record-form" onSubmit={addRow}>
          <Field
            id="add-zbozi"
            label="Zboží"
            options={store.catalog.zbozi}
            value={draft.zbozi}
            placeholder="Roleta den a noc"
            onChange={(value) => {
              setDraft((prev) => ({ ...prev, zbozi: value }));
              setFormError("");
            }}
          />
          <Field
            id="add-umisteni"
            label="Umístění"
            options={store.catalog.umisteni}
            value={draft.umisteni}
            placeholder="Sklad Ostrava"
            onChange={(value) => {
              setDraft((prev) => ({ ...prev, umisteni: value }));
              setFormError("");
            }}
          />
          <Field
            id="add-ucet"
            label="Účet"
            options={store.catalog.ucet}
            value={draft.ucet}
            placeholder="Pokladna"
            onChange={(value) => {
              setDraft((prev) => ({ ...prev, ucet: value }));
              setFormError("");
            }}
          />
          <label>
            Poznámka
            <input
              value={draft.note}
              maxLength={200}
              placeholder="Volitelné"
              onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
            />
          </label>
          <button className="cn-btn cn-btn-primary" type="submit">
            Přidat záznam
          </button>
        </form>
        {formError ? <p className="cn-error">{formError}</p> : null}

        <label className="cn-search cn-search-wide">
          <span className="cn-sr">Hledat</span>
          <input
            value={query}
            placeholder="Hledat ve zboží, umístění i účtu"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="cn-panel cn-table-wrap">
          <table className="cn-table">
            <thead>
              <tr>
                <th>Zboží</th>
                <th>Umístění</th>
                <th>Účet</th>
                <th>Poznámka</th>
                <th>
                  <span className="cn-sr">Akce</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="cn-empty-cell">
                    {store.rows.length === 0
                      ? "Zatím tu nic není. Přidejte první záznam."
                      : "Nic neodpovídá hledání."}
                  </td>
                </tr>
              ) : (
                visible.map((row) =>
                  editingId === row.id ? (
                    <tr key={row.id} className="cn-editing">
                      <td colSpan={5}>
                        <form className="cn-record-form cn-edit-row" onSubmit={saveEdit}>
                          <Field
                            id="edit-zbozi"
                            label="Zboží"
                            options={store.catalog.zbozi}
                            value={editDraft.zbozi}
                            onChange={(value) => setEditDraft((prev) => ({ ...prev, zbozi: value }))}
                          />
                          <Field
                            id="edit-umisteni"
                            label="Umístění"
                            options={store.catalog.umisteni}
                            value={editDraft.umisteni}
                            onChange={(value) =>
                              setEditDraft((prev) => ({ ...prev, umisteni: value }))
                            }
                          />
                          <Field
                            id="edit-ucet"
                            label="Účet"
                            options={store.catalog.ucet}
                            value={editDraft.ucet}
                            onChange={(value) => setEditDraft((prev) => ({ ...prev, ucet: value }))}
                          />
                          <label>
                            Poznámka
                            <input
                              value={editDraft.note}
                              maxLength={200}
                              onChange={(event) =>
                                setEditDraft((prev) => ({ ...prev, note: event.target.value }))
                              }
                            />
                          </label>
                          <div className="cn-edit-actions">
                            <button className="cn-btn cn-btn-primary" type="submit">
                              Uložit
                            </button>
                            <button
                              className="cn-btn"
                              type="button"
                              onClick={() => setEditingId(null)}
                            >
                              Zrušit
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.zbozi}</strong>
                      </td>
                      <td>{row.umisteni}</td>
                      <td>{row.ucet}</td>
                      <td className="cn-note">{row.note || "—"}</td>
                      <td>
                        <div className="cn-row-actions">
                          <button type="button" onClick={() => startEdit(row)}>
                            Upravit
                          </button>
                          <button type="button" onClick={() => removeRow(row)}>
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="cn-catalogs">
          {(["zbozi", "umisteni", "ucet"] as const).map((key) => (
            <div className="cn-panel cn-catalog" key={key}>
              <h2>{CATALOG_LABEL[key]}</h2>
              <p>Hodnoty, ze kterých se skládá záznam. Doplníte je sem nebo novým názvem výše.</p>
              <form
                className="cn-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  addCatalogName(key);
                }}
              >
                <label className="cn-sr" htmlFor={`cat-${key}`}>
                  Nová hodnota {CATALOG_LABEL[key]}
                </label>
                <input
                  id={`cat-${key}`}
                  value={catalogDraft[key]}
                  maxLength={80}
                  placeholder={`Nové ${CATALOG_LABEL[key].toLocaleLowerCase("cs")}`}
                  onChange={(event) =>
                    setCatalogDraft((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                />
                <button type="submit">Doplnit</button>
              </form>
              <ul>
                {store.catalog[key].map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="cn-foot">
          {ready
            ? "Záznamy jsou uložené v tomto prohlížeči. Export je zkopíruje do souboru."
            : "Načítám uložené číselníky…"}
        </p>

        {undo ? (
          <div className="cn-undo" role="status">
            <span>
              Smazáno: <strong>{undo.row.zbozi}</strong> / {undo.row.umisteni} / {undo.row.ucet}
            </span>
            <button type="button" onClick={restoreUndo}>
              Vrátit
            </button>
            <button type="button" onClick={() => setUndo(null)} aria-label="Zavřít">
              ×
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  options,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  options: string[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const listId = `${id}-options`;
  return (
    <label>
      {label}
      <input
        id={id}
        list={listId}
        value={value}
        maxLength={80}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {options.map((name) => (
          <option value={name} key={name} />
        ))}
      </datalist>
    </label>
  );
}
