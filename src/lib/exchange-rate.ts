import type { TransactionExtraction } from "@/lib/gemini";

/**
 * Converts an amount between currencies using the free, keyless Frankfurter
 * API (ECB reference rates). Returns null if the conversion can't be done
 * (unsupported currency pair, network error) so callers can fall back to the
 * original amount rather than failing the whole request.
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number | null> {
  if (from === to) return amount;
  try {
    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const converted = data?.rates?.[to];
    return typeof converted === "number" && Number.isFinite(converted) ? converted : null;
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
