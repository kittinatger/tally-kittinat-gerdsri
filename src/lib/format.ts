// Coarse "2h ago"/"3d ago"-style relative time for notification rows. Falls
// back to a plain locale date once it's more than a week old, since "52w
// ago" stops being useful at that point.
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, (Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

// Plain numeric string (no symbol/grouping) rounded to the currency's own
// decimal precision — e.g. 2 for USD, 0 for JPY, 3 for BHD — for contexts
// like CSV export where a hardcoded .toFixed(2) would truncate or pad
// incorrectly for non-2-decimal currencies.
export function formatAmountRaw(amount: number, currency: string = "USD"): string {
  const { minimumFractionDigits } = new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions();
  return amount.toFixed(minimumFractionDigits);
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function monthShortLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short" });
}

// Activities' "Group by" preference (see activities-prefs.ts) adds day-
// and week-level grouping alongside the existing month grouping above —
// same key/label pairing convention (a stable sortable string key, plus
// a separate locale-formatted display label for it).

export function dayKey(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function dayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

// Weeks always start on Sunday (day 0) — matches the app's own default
// week-start-day (see calendar settings); this doesn't read that
// per-user preference, so a user who's changed it to Monday elsewhere
// still sees Sunday-started week groups here.
export function weekKey(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay());
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function weekLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
