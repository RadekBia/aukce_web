"use client";

import { useEffect, useState } from "react";
import {
  formatCountdownCompact,
  formatCountdownFull,
  remainingUntil,
} from "@/lib/countdown";

export function AuctionCountdown({
  endsAt,
  variant = "full",
  className,
  onEnded,
}: {
  endsAt: string | Date;
  variant?: "full" | "compact";
  className?: string;
  onEnded?: () => void;
}) {
  const endsAtMs = new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [firedEnded, setFiredEnded] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = remainingUntil(endsAtMs, now);

  useEffect(() => {
    if (remaining.ended && !firedEnded) {
      setFiredEnded(true);
      onEnded?.();
    }
  }, [remaining.ended, firedEnded, onEnded]);

  const text =
    variant === "compact"
      ? formatCountdownCompact(remaining)
      : formatCountdownFull(remaining);

  const classes = [
    "auction-countdown",
    variant === "compact" ? "auction-countdown-compact" : "auction-countdown-full",
    remaining.ended ? "auction-countdown-ended" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={classes} role="timer" aria-live="polite">
      {text}
    </p>
  );
}
