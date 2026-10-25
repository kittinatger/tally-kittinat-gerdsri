// Signatures are stored as SVG path data in a fixed 600×150 box (see
// SignaturePad) — compact, and crisp at any size on the back of a card.
export const SIGNATURE_VIEWBOX = { width: 600, height: 150 };
const MAX_LENGTH = 30_000;

/** A drawn signature, or null to clear it — anything else is rejected. */
export function parseSignature(value: unknown): { ok: true; signature: string | null } | { ok: false } {
  if (value === null) return { ok: true, signature: null };
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) return { ok: false };
  // Only move/line/quadratic commands and numbers — never markup.
  if (!/^[MLQ0-9.\s-]+$/.test(value)) return { ok: false };
  return { ok: true, signature: value };
}
