export type Remaining = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

export function remainingUntil(endsAtMs: number, nowMs = Date.now()): Remaining {
  const totalMs = Math.max(0, endsAtMs - nowMs);
  const ended = totalMs <= 0;
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { totalMs, days, hours, minutes, seconds, ended };
}

function czechUnit(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/** Full Czech countdown, e.g. "Zbývá 2 dny 5 hodin 3 minuty 12 sekund". */
export function formatCountdownFull(r: Remaining): string {
  if (r.ended) return "Aukce skončila";
  const parts: string[] = [];
  if (r.days > 0) {
    parts.push(
      `${r.days} ${czechUnit(r.days, "den", "dny", "dní")}`,
    );
  }
  if (r.days > 0 || r.hours > 0) {
    parts.push(
      `${r.hours} ${czechUnit(r.hours, "hodina", "hodiny", "hodin")}`,
    );
  }
  parts.push(
    `${r.minutes} ${czechUnit(r.minutes, "minuta", "minuty", "minut")}`,
  );
  parts.push(
    `${r.seconds} ${czechUnit(r.seconds, "sekunda", "sekundy", "sekund")}`,
  );
  return `Zbývá ${parts.join(" ")}`;
}

/** Short Czech countdown for cards, e.g. "2 d 5 h", "3 h 12 m", "45 s". */
export function formatCountdownCompact(r: Remaining): string {
  if (r.ended) return "Skončila";
  if (r.days > 0) return `${r.days} d ${r.hours} h`;
  if (r.hours > 0) return `${r.hours} h ${r.minutes} m`;
  if (r.minutes > 0) return `${r.minutes} m ${r.seconds} s`;
  return `${r.seconds} s`;
}
