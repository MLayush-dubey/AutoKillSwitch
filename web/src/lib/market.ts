/**
 * Market-hour helpers for NSE/Dhan. Uses IST (+05:30) regardless of client tz.
 * Weekend-aware; holiday-aware is out of scope for the demo.
 */
export type MarketStatus =
  | { state: "open"; minutesToClose: number }
  | { state: "pre_open"; minutesToOpen: number }
  | { state: "closed"; minutesToOpen: number };

const IST_OFFSET_MIN = 330;

function istNow(base = new Date()): Date {
  const utcMs = base.getTime() + base.getTimezoneOffset() * 60_000;
  return new Date(utcMs + IST_OFFSET_MIN * 60_000);
}

export function getMarketStatus(now = new Date()): MarketStatus {
  const ist = istNow(now);
  const day = ist.getUTCDay(); // 0 Sun, 6 Sat (we're treating ist as UTC-adjusted)
  const minutesSinceMidnight = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const OPEN = 9 * 60 + 15;
  const CLOSE = 15 * 60 + 30;

  if (day === 0 || day === 6) {
    // Weekend — next open is Monday 09:15
    const daysToMonday = day === 0 ? 1 : 2;
    const minutesToOpen =
      daysToMonday * 24 * 60 + OPEN - minutesSinceMidnight;
    return { state: "closed", minutesToOpen };
  }

  if (minutesSinceMidnight < OPEN) {
    return { state: "pre_open", minutesToOpen: OPEN - minutesSinceMidnight };
  }
  if (minutesSinceMidnight < CLOSE) {
    return { state: "open", minutesToClose: CLOSE - minutesSinceMidnight };
  }
  // After 15:30 — next open tomorrow or Monday
  const daysToNext = day === 5 ? 3 : 1;
  const minutesToOpen = daysToNext * 24 * 60 + OPEN - minutesSinceMidnight;
  return { state: "closed", minutesToOpen };
}

export function formatDuration(mins: number): string {
  if (mins <= 0) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
