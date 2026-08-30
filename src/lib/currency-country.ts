import { CURRENCIES } from "@/lib/currencies";

// A representative country per currency code, for suggesting a card
// template's country from whatever currency it's locked to (see
// card_templates.force_currency) — one currency can technically be used by
// several countries (EUR, USD as a secondary currency elsewhere, etc.),
// so this picks the single most obvious/common one rather than trying to
// be exhaustive; it's only ever a starting suggestion the submitter or
// admin can override, never enforced.
const CURRENCY_COUNTRY: Record<string, string> = {
  USD: "United States",
  EUR: "Eurozone",
  GBP: "United Kingdom",
  JPY: "Japan",
  THB: "Thailand",
  AUD: "Australia",
  CAD: "Canada",
  CHF: "Switzerland",
  CNY: "China",
  HKD: "Hong Kong",
  SGD: "Singapore",
  INR: "India",
  KRW: "South Korea",
  NZD: "New Zealand",
  SEK: "Sweden",
  NOK: "Norway",
  DKK: "Denmark",
  PLN: "Poland",
  MXN: "Mexico",
  BRL: "Brazil",
  ZAR: "South Africa",
  AED: "United Arab Emirates",
  SAR: "Saudi Arabia",
  TRY: "Turkey",
  RUB: "Russia",
  IDR: "Indonesia",
  MYR: "Malaysia",
  PHP: "Philippines",
  VND: "Vietnam",
  PKR: "Pakistan",
};

// Sanity check, dev-time only — every currency the app actually offers
// should have an entry here, so a newly-added currency in currencies.ts
// doesn't silently fall through to "no suggestion" without anyone noticing.
if (process.env.NODE_ENV !== "production") {
  const missing = CURRENCIES.filter((c) => !CURRENCY_COUNTRY[c.code]).map((c) => c.code);
  if (missing.length > 0) {
    console.warn(`currency-country.ts: no country mapped for ${missing.join(", ")}`);
  }
}

export function countryForCurrency(code: string | null | undefined): string | null {
  if (!code) return null;
  return CURRENCY_COUNTRY[code] ?? null;
}

// Every country this map knows about — feeds a <datalist> for the country
// input in WalletModal/TemplateEditModal, so typing still works for
// anything not in this curated set (it's just a suggestion list, never
// enforced), but the common cases autocomplete.
export const KNOWN_COUNTRIES: string[] = [...new Set(Object.values(CURRENCY_COUNTRY))].sort((a, b) => a.localeCompare(b));
