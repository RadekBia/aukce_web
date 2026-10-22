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
  signedIn: boolean;
  accountLabel: string | null;
  price: number;
  startingPrice: number;
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
  signedIn,
  accountLabel,
  initialBids,
  children,
}: {
  auctionId: string;
  currentPrice: number;
  startingPrice: number;
  canBid: boolean;
  signedIn: boolean;
  accountLabel: string | null;
  initialBids: BidRow[];
  children: ReactNode;
}) {
  const router = useRouter();
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
    if (!signedIn) {
      setError("Pro přihazování se přihlaste přes Google.");
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
        body: JSON.stringify({ amount: amountNum }),
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
        signedIn,
        accountLabel,
        price,
        startingPrice,
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
  const { canBid, signedIn, price, startingPrice, pending } = useBidCtx();
  const showBidButton = canBid && signedIn;

  return (
    <div className="detail-prices detail-prices-with-bid">
      <div className="detail-price-current">
        <small>Aktuální cena</small>
        <div className="detail-price-current-row">
          <strong className="price-lg">{money(price)}</strong>
          {showBidButton && (
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

/** Amount field (and messages) on the right; identity from Google session. */
export function BidFields() {
  const {
    canBid,
    signedIn,
    accountLabel,
    price,
    amount,
    setAmount,
    error,
    ok,
    onSubmit,
  } = useBidCtx();

  if (!canBid) {
    return <p className="notice">Do této aukce už nelze přihazovat.</p>;
  }

  if (!signedIn) {
    return (
      <p className="notice bid-warn">
        Pro přihazování se přihlaste přes Google (tlačítko{" "}
        <strong>Přihlásit se přes Google</strong> v záhlaví).
      </p>
    );
  }

  return (
    <form id={FORM_ID} className="bid-form" onSubmit={onSubmit}>
      <h2>Přihodit</h2>
      <p className="bid-hint">
        Přihazujete jako <strong>{accountLabel ?? "Google účet"}</strong>.
      </p>
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

/** Bid history — intended for the left column under the gallery. */
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
