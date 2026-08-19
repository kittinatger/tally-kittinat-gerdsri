// Conversions backing the custom-color panel in ColorPicker.tsx. Every
// selector in the app stores color as plain TEXT — a named palette token
// (e.g. "emerald") or, for a custom pick, a 6-digit hex string — so a
// custom color needs no schema change anywhere, just this math plus a
// place in each color field's rendering to fall back to it (see
// colorStyle in category-styles.ts).

export type RGB = { r: number; g: number; b: number };
export type CMYK = { c: number; m: number; y: number; k: number };
/** h: 0-360, s/v: 0-100 — backs the gradient square + hue slider in ColorPicker. */
export type HSV = { h: number; s: number; v: number };

const HEX_RE = /^#?[0-9a-f]{6}$/i;

export function isHexColor(value: string | undefined | null): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

export function normalizeHex(hex: string): string {
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  return h.toLowerCase();
}

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);
  const c = (1 - rp - k) / (1 - k);
  const m = (1 - gp - k) / (1 - k);
  const y = (1 - bp - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rp) h = 60 * (((gp - bp) / delta) % 6);
    else if (max === gp) h = 60 * ((bp - rp) / delta + 2);
    else h = 60 * ((rp - gp) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = vn - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hp >= 0 && hp < 1) [rp, gp, bp] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [rp, gp, bp] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [rp, gp, bp] = [0, c, x];
  else if (hp >= 3 && hp < 4) [rp, gp, bp] = [0, x, c];
  else if (hp >= 4 && hp < 5) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cn = c / 100;
  const mn = m / 100;
  const yn = y / 100;
  const kn = k / 100;
  return {
    r: 255 * (1 - cn) * (1 - kn),
    g: 255 * (1 - mn) * (1 - kn),
    b: 255 * (1 - yn) * (1 - kn),
  };
}
