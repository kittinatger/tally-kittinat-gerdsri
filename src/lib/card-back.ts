// How the back of a payment card looks — set per card in its detail view
// ("Customise back"), stored as one JSON text column (wallets.back_design).
// Client-safe: no server imports.
import { normalizeCardBackground, type CardBackground } from "@/lib/card-backgrounds";
import { isHexColor } from "@/lib/color-convert";

export type CardBackDesign = {
  /** false = "match the front": the back follows the front's colour automatically. */
  custom: boolean;
  /** The back's plain colour (a palette token or hex) when custom and no pattern/photo. */
  color: string;
  /** A pattern, gradient or photo for the back when custom — null for the plain colour. */
  background: CardBackground | null;
  /** Manual text colour, or null for auto-contrast. */
  textColor: string | null;
  showStripe: boolean;
  showSignature: boolean;
  showBalance: boolean;
  showCurrency: boolean;
  showHolder: boolean;
  showExpiry: boolean;
};

export const DEFAULT_BACK_DESIGN: CardBackDesign = {
  custom: false,
  color: "slate",
  background: null,
  textColor: null,
  showStripe: true,
  showSignature: true,
  showBalance: true,
  showCurrency: true,
  showHolder: true,
  showExpiry: true,
};

// A photo background is embedded as a data URL, so allow for it — but not unbounded.
const MAX_JSON_LENGTH = 2_500_000;

const BOOLEAN_KEYS = ["showStripe", "showSignature", "showBalance", "showCurrency", "showHolder", "showExpiry"] as const;

/** Tolerant parse of anything stored or submitted: unknown/malformed parts fall back to the defaults. */
export function normalizeBackDesign(raw: unknown): CardBackDesign {
  const out: CardBackDesign = { ...DEFAULT_BACK_DESIGN };
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.custom === "boolean") out.custom = obj.custom;
  if (typeof obj.color === "string" && (isHexColor(obj.color) || /^[a-z]{3,12}$/.test(obj.color))) out.color = obj.color;
  out.background = normalizeCardBackground(obj.background);
  if (typeof obj.textColor === "string" && isHexColor(obj.textColor)) out.textColor = obj.textColor;
  for (const key of BOOLEAN_KEYS) if (typeof obj[key] === "boolean") out[key] = obj[key];
  return out;
}

export function parseBackDesign(text: string | null | undefined): CardBackDesign {
  if (!text) return { ...DEFAULT_BACK_DESIGN };
  try {
    return normalizeBackDesign(JSON.parse(text));
  } catch {
    return { ...DEFAULT_BACK_DESIGN };
  }
}

/** For the API: a design to store (as JSON text), or null to reset to the default. */
export function serializeBackDesign(value: unknown): { ok: true; json: string | null } | { ok: false } {
  if (value === null) return { ok: true, json: null };
  if (typeof value !== "object") return { ok: false };
  const json = JSON.stringify(normalizeBackDesign(value));
  return json.length > MAX_JSON_LENGTH ? { ok: false } : { ok: true, json };
}
