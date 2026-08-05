import type { TransactionExtraction } from "@/lib/gemini";

// ECB reference rates (what Frankfurter serves) update once a day, so
// re-fetching per request — e.g. on every Dashboard load when wallet-balance
// conversion is on — was pure wasted latency. Cached by currency pair for an
// hour; module-scoped, so it only actually helps within a warm server
// instance, but that's the common case for back-to-back page loads.
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const rateCache = new Map<string, { rate: number; expiresAt: number }>();

// Bounds worst case for a single external call — without this, a slow or
// hanging Frankfurter response could block an entire page render (this is
// awaited directly on the Dashboard's critical path when wallet-balance
// conversion is enabled).
const FETCH_TIMEOUT_MS = 2500;

/**
 * Converts an amount between currencies using the free, keyless Frankfurter
 * API (ECB reference rates). Returns null if the conversion can't be done
 * (unsupported currency pair, network error, timeout) so callers can fall
 * back to the original amount rather than failing the whole request.
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number | null> {
  if (from === to) return amount;

  const cacheKey = `${from}|${to}`;
  const cached = rateCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return amount * cached.rate;
  }

  try {
    const url = `https://api.frankfurter.app/latest?amount=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[to];
    if (typeof rate !== "number" || !Number.isFinite(rate)) return null;
    rateCache.set(cacheKey, { rate, expiresAt: Date.now() + RATE_CACHE_TTL_MS });
    return amount * rate;
  } catch {
    return null;
  }
}

export type ConvertedExtraction = TransactionExtraction & {
  originalAmount?: number;
  originalCurrency?: string;
};

/**
 * If auto-convert is on and the detected currency differs from the app's
 * default, converts the extracted amount in place and records the original
 * amount/currency for display. Leaves the extraction untouched if disabled,
 * the currency wasn't detected, it already matches, or conversion fails.
 */
export async function maybeAutoConvert(
  extraction: TransactionExtraction,
  defaultCurrency: string,
  enabled: boolean,
): Promise<ConvertedExtraction> {
  if (!enabled || !extraction.currency || extraction.currency === defaultCurrency) {
    return extraction;
  }
  const converted = await convertAmount(extraction.amount, extraction.currency, defaultCurrency);
  if (converted === null) return extraction;
  return {
    ...extraction,
    amount: converted,
    originalAmount: extraction.amount,
    originalCurrency: extraction.currency,
  };
}
