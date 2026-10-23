"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type BidRow = {
  id: string;
  bidderId: string;
  amount: number;
  createdAt: string | Date;
};

const money = (n: number) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);

const FORM_ID = "aukce-bid-form";

type BidCtx = {
  auctionId: string;
  canBid: boolean;
  price: number;
  startingPrice: number;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  bids: BidRow[];
  error: string | null;
  ok: string | null;
  pending: boolean;
  onSubmit: (e: FormEvent) => void;
};

const Ctx = createContext<BidCtx | null>(null);

function useBidCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error("Bid components must be inside BidProvider");
  return v;
}

export function BidProvider({
  auctionId,
  currentPrice,
  startingPrice,
  canBid,
  initialBids,
  children,
}: {
  auctionId: string;
  currentPrice: number;
  startingPrice: number;
  canBid: boolean;
  initialBids: BidRow[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [amount, setAmount] = useState(String(currentPrice + 10));
  const [price, setPrice] = useState(currentPrice);
  const [bids, setBids] = useState(initialBids);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPrice(currentPrice);
    setAmount(String(currentPrice + 10));
    setBids(initialBids);
  }, [currentPrice, initialBids, auctionId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 1 || ln.length < 1) {
      setError("Zadejte jméno i příjmení.");
      return;
    }
    const amountNum = Number(amount);
    if (!Number.isInteger(amountNum) || amountNum <= 0) {
      setError("Částka musí být celé kladné číslo v Kč.");
      return;
    }
    if (amountNum <= price) {
      setError(
        `Příhoz musí být vyšší než aktuální cena (${money(price)}).`,
      );
      return;
    }
    if (!canBid) {
      setError("Do této aukce už nelze přihazovat.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: fn,
          lastName: ln,
          amount: amountNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Příhoz se nepodařilo uložit.",
        );
        return;
      }
      setPrice(data.auction.currentPrice);
      setAmount(String(data.auction.currentPrice + 10));
      setBids((prev) => [data.bid, ...prev.filter((b) => b.id !== data.bid.id)]);
      setOk(`Příhoz ${money(amountNum)} uložen.`);
      router.refresh();
    } catch {
      setError("Síťová chyba při odesílání příhozu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Ctx.Provider
      value={{
        auctionId,
        canBid,
        price,
        startingPrice,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        amount,
        setAmount,
        bids,
        error,
        ok,
        pending,
        onSubmit,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** Current + starting price; Přihodit sits on the same row as current price. */
export function BidPriceRow() {
  const { canBid, price, startingPrice, pending } = useBidCtx();

  return (
    <div className="detail-prices detail-prices-with-bid">
      <div className="detail-price-current">
        <small>Aktuální cena</small>
        <div className="detail-price-current-row">
          <strong className="price-lg">{money(price)}</strong>
          {canBid && (
            <button
              className="btn"
              type="submit"
              form={FORM_ID}
              disabled={pending}
            >
              {pending ? "Odesílám…" : "Přihodit"}
            </button>
          )}
        </div>
      </div>
      <div>
        <small>Vyvolávací cena</small>
        <strong className="muted-price">{money(startingPrice)}</strong>
      </div>
    </div>
  );
}

/** Jméno, příjmení, částka — submit via price-row button. */
export function BidFields() {
  const {
    canBid,
    price,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    amount,
    setAmount,
    error,
    ok,
    onSubmit,
  } = useBidCtx();

  if (!canBid) {
    return <p className="notice">Do této aukce už nelze přihazovat.</p>;
  }

  return (
    <form id={FORM_ID} className="bid-form" onSubmit={onSubmit}>
      <h2>Přihodit</h2>
      <label>
        Jméno
        <input
          name="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          minLength={1}
          maxLength={40}
          autoComplete="given-name"
        />
      </label>
      <label>
        Příjmení
        <input
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          minLength={1}
          maxLength={40}
          autoComplete="family-name"
        />
      </label>
      <label>
        Částka (Kč)
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          min={price + 1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      {error && <p className="bid-error">{error}</p>}
      {ok && <p className="bid-ok">{ok}</p>}
    </form>
  );
}

/** Bid history — under the gallery. */
export function BidList() {
  const { bids } = useBidCtx();

  return (
    <div className="bid-list-panel">
      <h2>Nedávné příhozy</h2>
      {bids.length === 0 ? (
        <p className="detail-meta">Zatím žádné příhozy.</p>
      ) : (
        <ul className="bid-list">
          {bids.map((b) => (
            <li key={b.id}>
              <span>{b.bidderId}</span>
              <strong>{money(b.amount)}</strong>
              <time dateTime={String(b.createdAt)}>
                {new Date(b.createdAt).toLocaleString("cs-CZ", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
