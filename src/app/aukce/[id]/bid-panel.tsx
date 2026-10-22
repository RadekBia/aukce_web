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

const STORAGE_KEY = "aukce_local_bidder";
const FORM_ID = "aukce-bid-form";

type BidCtx = {
  auctionId: string;
  canBid: boolean;
  price: number;
  startingPrice: number;
  amount: string;
  setAmount: (v: string) => void;
  bidder: string;
  setBidder: (v: string) => void;
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
  const [bidder, setBidder] = useState("");
  const [amount, setAmount] = useState(String(currentPrice + 10));
  const [price, setPrice] = useState(currentPrice);
  const [bids, setBids] = useState(initialBids);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBidder(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setPrice(currentPrice);
    setAmount(String(currentPrice + 10));
    setBids(initialBids);
  }, [currentPrice, initialBids, auctionId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const trimmed = bidder.trim();
    if (trimmed.length < 2) {
      setError("Zadejte jméno nebo e-mail (alespoň 2 znaky).");
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
        body: JSON.stringify({ bidder: trimmed, amount: amountNum }),
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
      try {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } catch {
        /* ignore */
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
        amount,
        setAmount,
        bidder,
        setBidder,
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

/** Name + amount fields (and messages) on the right; submit via price-row button. */
export function BidFields() {
  const {
    canBid,
    price,
    amount,
    setAmount,
    bidder,
    setBidder,
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
      <p className="bid-hint">
        Lokální vývoj: zadejte jméno nebo e-mail — není to přihlášení ani
        ověřená identita. Hodnota se uloží do <code>Bid.bidderId</code>.
      </p>
      <label>
        Jméno / e-mail
        <input
          name="bidder"
          value={bidder}
          onChange={(e) => setBidder(e.target.value)}
          placeholder="např. jan@example.cz"
          required
          minLength={2}
          maxLength={80}
          autoComplete="nickname"
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
