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

export function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
