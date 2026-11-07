"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ColumnKey = "zbozi" | "umisteni" | "ucet";

type Entry = {
  id: string;
  code: string;
  name: string;
  note: string;
};

type Lists = Record<ColumnKey, Entry[]>;

const STORAGE_KEY = "aukce.ciselniky.v1";

const COLUMNS: {
  key: ColumnKey;
  title: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: "zbozi",
    title: "Zboží",
    hint: "Výrobky, materiál a služby, které vedete.",
    placeholder: "Nové zboží",
  },
  {
    key: "umisteni",
    title: "Umístění",
    hint: "Sklad, vůz, pobočka nebo jiné místo.",
    placeholder: "Nové umístění",
  },
  {
    key: "ucet",
    title: "Účet",
    hint: "Pokladna, banka, záloha a další účty.",
    placeholder: "Nový účet",
  },
];

function item(id: string, code: string, name: string, note = ""): Entry {
  return { id, code, name, note };
}

const SEED: Lists = {
  zbozi: [
    item("z1", "ROL-DN", "Roleta den a noc"),
    item("z2", "ZAL-H", "Horizontální žaluzie"),
    item("z3", "PLISE", "Plisé"),
    item("z4", "SIT", "Síť proti hmyzu"),
  ],
  umisteni: [
    item("u1", "SKL-OVA", "Sklad Ostrava"),
    item("u2", "SKL-PHA", "Sklad Praha"),
    item("u3", "VUZ-1", "Montážní vůz 1"),
    item("u4", "SHOW", "Showroom"),
  ],
  ucet: [
    item("a1", "POK", "Pokladna"),
    item("a2", "FIO", "Banka Fio"),
    item("a3", "ZAL", "Zálohy zákazníků"),
    item("a4", "HOT", "Hotovost u technika"),
  ],
};

function codeFromName(name: string): string {
  const ascii = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = ascii
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
  return slug || "POL";
}

function uniqueCode(list: Entry[], base: string, ignoreId?: string): string {
  const used = new Set(
    list.filter((entry) => entry.id !== ignoreId).map((entry) => entry.code.toLowerCase()),
  );
  const root = (base || "POL").slice(0, 12);
  if (!used.has(root.toLowerCase())) return root;
  let n = 2;
  let next = `${root}-${n}`.slice(0, 16);
  while (used.has(next.toLowerCase())) {
    n += 1;
    next = `${root}-${n}`.slice(0, 16);
  }
  return next;
}

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    typeof row.code === "string" &&
    row.code.length <= 16 &&
    typeof row.name === "string" &&
    row.name.trim().length > 0 &&
    row.name.length <= 80 &&
    (row.note === undefined || (typeof row.note === "string" && row.note.length <= 200))
  );
}

function parseLists(value: unknown): Lists | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const next = {} as Lists;
  for (const column of COLUMNS) {
    const rows = raw[column.key];
    if (!Array.isArray(rows) || !rows.every(isEntry)) return null;
    next[column.key] = rows.map((row) => ({
      id: row.id,
      code: row.code.trim(),
      name: row.name.trim(),
      note: (row.note ?? "").trim(),
    }));
  }
  return next;
}

function loadLists(): Lists {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = parseLists(JSON.parse(raw));
    return parsed ?? SEED;
  } catch {
    return SEED;
  }
}

export function CiselnikyBoard() {
  const [lists, setLists] = useState<Lists>(SEED);
  const [ready, setReady] = useState(false);
  const [drafts, setDrafts] = useState<Record<ColumnKey, string>>({
    zbozi: "",
    umisteni: "",
    ucet: "",
  });
  const [queries, setQueries] = useState<Record<ColumnKey, string>>({
    zbozi: "",
    umisteni: "",
    ucet: "",
  });
  const [errors, setErrors] = useState<Partial<Record<ColumnKey, string>>>({});
  const [editing, setEditing] = useState<{ column: ColumnKey; id: string } | null>(null);
  const [editDraft, setEditDraft] = useState({ code: "", name: "", note: "" });
  const [editError, setEditError] = useState("");
  const [undo, setUndo] = useState<{
    column: ColumnKey;
    entry: Entry;
    index: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLists(loadLists());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  }, [lists, ready]);

  const visible = useMemo(() => {
    const out = {} as Record<ColumnKey, Entry[]>;
    for (const column of COLUMNS) {
      const q = queries[column.key].trim().toLocaleLowerCase("cs");
      out[column.key] = lists[column.key].filter((entry) => {
        if (!q) return true;
        return `${entry.code} ${entry.name} ${entry.note}`.toLocaleLowerCase("cs").includes(q);
      });
    }
    return out;
  }, [lists, queries]);

  function addItem(column: ColumnKey) {
    const name = drafts[column].trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, [column]: "Napište název položky." }));
      return;
    }
    if (name.length > 80) {
      setErrors((prev) => ({ ...prev, [column]: "Název může mít nejvýš 80 znaků." }));
      return;
    }
    const code = uniqueCode(lists[column], codeFromName(name));
    const row: Entry = { id: crypto.randomUUID(), code, name, note: "" };
    setLists((prev) => ({ ...prev, [column]: [row, ...prev[column]] }));
    setDrafts((prev) => ({ ...prev, [column]: "" }));
    setErrors((prev) => ({ ...prev, [column]: undefined }));
  }

  function startEdit(column: ColumnKey, entry: Entry) {
    setEditing({ column, id: entry.id });
    setEditDraft({ code: entry.code, name: entry.name, note: entry.note });
    setEditError("");
  }

  function saveEdit() {
    if (!editing) return;
    const name = editDraft.name.trim();
    const note = editDraft.note.trim();
    const codeInput = editDraft.code.trim();
    if (!name) {
      setEditError("Název je povinný.");
      return;
    }
    if (name.length > 80 || note.length > 200) {
      setEditError("Název má nejvýš 80 znaků, poznámka 200.");
      return;
    }
    const code = uniqueCode(
      lists[editing.column],
      (codeInput || codeFromName(name)).toUpperCase(),
      editing.id,
    );
    setLists((prev) => ({
      ...prev,
      [editing.column]: prev[editing.column].map((entry) =>
        entry.id === editing.id ? { ...entry, code, name, note } : entry,
      ),
    }));
    setEditing(null);
  }

  function removeItem(column: ColumnKey, entry: Entry) {
    const index = lists[column].findIndex((row) => row.id === entry.id);
    setLists((prev) => ({
      ...prev,
      [column]: prev[column].filter((row) => row.id !== entry.id),
    }));
    if (editing?.id === entry.id) setEditing(null);
    setUndo({ column, entry, index: Math.max(index, 0) });
  }

  function restoreUndo() {
    if (!undo) return;
    setLists((prev) => {
      const rows = [...prev[undo.column]];
      rows.splice(Math.min(undo.index, rows.length), 0, undo.entry);
      return { ...prev, [undo.column]: rows };
    });
    setUndo(null);
  }

  function exportLists() {
    const blob = new Blob([JSON.stringify(lists, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ciselniky.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importLists(file: File) {
    try {
      const parsed = parseLists(JSON.parse(await file.text()));
      if (!parsed) {
        setEditError("");
        window.alert("Soubor neobsahuje platné číselníky zboží, umístění a účtu.");
        return;
      }
      setLists(parsed);
      setEditing(null);
      setUndo(null);
    } catch {
      window.alert("Soubor se nepodařilo přečíst. Očekává se JSON export z této stránky.");
    }
  }

  return (
    <div className="cn-app">
      <div className="cn-wrap">
        <div className="cn-top">
          <div>
            <p className="cn-kicker">ČÍSELNÍKY</p>
            <h1>Zboží, umístění a účet</h1>
            <p className="cn-lead">
              Každý sloupec je vlastní seznam. Položky přidáte, přejmenujete nebo smažete
              a zůstanou uložené v tomto prohlížeči.
            </p>
          </div>
          <div className="cn-actions">
            <button type="button" className="cn-btn" onClick={exportLists}>
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
                if (file) void importLists(file);
              }}
            />
            <Link className="cn-btn cn-btn-ghost" href="/">
              Zpět na aukce
            </Link>
          </div>
        </div>

        <div className="cn-board">
          {COLUMNS.map((column) => (
            <div className="cn-col" key={column.key} role="region" aria-labelledby={`cn-${column.key}`}>
              <div className="cn-col-head">
                <div>
                  <h2 id={`cn-${column.key}`}>{column.title}</h2>
                  <p>{column.hint}</p>
                </div>
                <span className="cn-count">{lists[column.key].length}</span>
              </div>

              <form
                className="cn-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  addItem(column.key);
                }}
              >
                <label className="cn-sr" htmlFor={`add-${column.key}`}>
                  {column.placeholder}
                </label>
                <input
                  id={`add-${column.key}`}
                  value={drafts[column.key]}
                  placeholder={column.placeholder}
                  maxLength={80}
                  onChange={(event) => {
                    setDrafts((prev) => ({ ...prev, [column.key]: event.target.value }));
                    setErrors((prev) => ({ ...prev, [column.key]: undefined }));
                  }}
                />
                <button type="submit">Přidat</button>
              </form>
              {errors[column.key] ? <p className="cn-error">{errors[column.key]}</p> : null}

              <label className="cn-search">
                <span className="cn-sr">Hledat v {column.title}</span>
                <input
                  value={queries[column.key]}
                  placeholder="Hledat"
                  onChange={(event) =>
                    setQueries((prev) => ({ ...prev, [column.key]: event.target.value }))
                  }
                />
              </label>

              <ul className="cn-list">
                {visible[column.key].length === 0 ? (
                  <li className="cn-empty">
                    {lists[column.key].length === 0
                      ? "Zatím tu nic není. Přidejte první položku."
                      : "Nic neodpovídá hledání."}
                  </li>
                ) : (
                  visible[column.key].map((entry) => {
                    const open = editing?.column === column.key && editing.id === entry.id;
                    return (
                      <li className="cn-item" key={entry.id}>
                        {open ? (
                          <form
                            className="cn-edit"
                            onSubmit={(event) => {
                              event.preventDefault();
                              saveEdit();
                            }}
                          >
                            <label>
                              Kód
                              <input
                                value={editDraft.code}
                                maxLength={16}
                                onChange={(event) =>
                                  setEditDraft((prev) => ({ ...prev, code: event.target.value }))
                                }
                              />
                            </label>
                            <label>
                              Název
                              <input
                                value={editDraft.name}
                                maxLength={80}
                                autoFocus
                                onChange={(event) =>
                                  setEditDraft((prev) => ({ ...prev, name: event.target.value }))
                                }
                              />
                            </label>
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
                            {editError ? <p className="cn-error">{editError}</p> : null}
                            <div className="cn-edit-actions">
                              <button type="submit" className="cn-btn cn-btn-primary">
                                Uložit
                              </button>
                              <button
                                type="button"
                                className="cn-btn"
                                onClick={() => setEditing(null)}
                              >
                                Zrušit
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="cn-row">
                            <span className="cn-code">{entry.code}</span>
                            <div className="cn-name">
                              <strong>{entry.name}</strong>
                              {entry.note ? <small>{entry.note}</small> : null}
                            </div>
                            <div className="cn-row-actions">
                              <button type="button" onClick={() => startEdit(column.key, entry)}>
                                Upravit
                              </button>
                              <button type="button" onClick={() => removeItem(column.key, entry)}>
                                Smazat
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>

        <p className="cn-foot">
          {ready
            ? "Seznamy jsou uložené v tomto prohlížeči. Export je zkopíruje do souboru."
            : "Načítám uložené číselníky…"}
        </p>

        {undo ? (
          <div className="cn-undo" role="status">
            <span>
              Smazáno: <strong>{undo.entry.name}</strong>
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
