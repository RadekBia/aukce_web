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
import { MIN_BID_RAISE } from "@/lib/auction-rules";

type BidRow = {
  id: string;
  bidderId: string;
  /** Raise amount in Kč (navýšení), not the new total. */
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
  timeEnded: boolean;
  price: number;
  startingPrice: number;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  raise: string;
  setRaise: (v: string) => void;
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
  statusAllowsBid,
  endsAt,
  initialBids,
  children,
}: {
  auctionId: string;
  currentPrice: number;
  startingPrice: number;
  statusAllowsBid: boolean;
  endsAt: string;
  initialBids: BidRow[];
  children: ReactNode;
}) {
  const router = useRouter();
  const endsAtMs = new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [raise, setRaise] = useState(String(MIN_BID_RAISE));
  const [price, setPrice] = useState(currentPrice);
  const [bids, setBids] = useState(initialBids);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const timeEnded = now >= endsAtMs;
  const canBid = statusAllowsBid && !timeEnded;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPrice(currentPrice);
    setRaise(String(MIN_BID_RAISE));
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
    const raiseNum = Number(raise);
    if (!Number.isInteger(raiseNum) || raiseNum < MIN_BID_RAISE) {
      setError(`Navýšení musí být celé číslo alespoň ${MIN_BID_RAISE} Kč.`);
      return;
    }
    if (Date.now() >= endsAtMs) {
      setError("Aukce už skončila.");
      setNow(Date.now());
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
          raise: raiseNum,
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
      setRaise(String(MIN_BID_RAISE));
      setBids((prev) => [data.bid, ...prev.filter((b) => b.id !== data.bid.id)]);
      setOk(
        `Navýšení ${money(raiseNum)} uloženo. Nová cena ${money(data.auction.currentPrice)}.`,
      );
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
        timeEnded,
        price,
        startingPrice,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        raise,
        setRaise,
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

export function BidFields() {
  const {
    canBid,
    timeEnded,
    price,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    raise,
    setRaise,
    error,
    ok,
    onSubmit,
  } = useBidCtx();

  if (!canBid) {
    return (
      <p className="notice">
        {timeEnded
          ? "Aukce skončila — nové příhozy už nepřijímáme."
          : "Do této aukce už nelze přihazovat."}
      </p>
    );
  }

  const raiseNum = Number(raise);
  const preview =
    Number.isInteger(raiseNum) && raiseNum >= MIN_BID_RAISE
      ? price + raiseNum
      : null;

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
        Navýšení (Kč)
        <input
          name="raise"
          type="number"
          inputMode="numeric"
          min={MIN_BID_RAISE}
          step={MIN_BID_RAISE}
          value={raise}
          onChange={(e) => setRaise(e.target.value)}
          required
        />
      </label>
      {preview !== null && (
        <p className="bid-hint">
          Nová cena po příhozu: <strong>{money(preview)}</strong>
        </p>
      )}
      {error && <p className="bid-error">{error}</p>}
      {ok && <p className="bid-ok">{ok}</p>}
    </form>
  );
}

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
              <strong>+{money(b.amount)}</strong>
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
