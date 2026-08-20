// Backs "Scan a card" in CardBackgroundPicker — lets a user photograph a
// real card and derive a background from it: guess its four corners, warp
// the photo to the card's true rectangle (correcting for the angle it was
// held at), then extract a small color palette from the corrected image.
//
// This is a from-scratch, dependency-free implementation (no OpenCV.js/
// WASM), so two pieces are deliberately lightweight heuristics rather than
// full computer vision:
//   - detectCardCorners scans inward from the image's four corners looking
//     for the first strong brightness change, as a starting *guess* — not
//     a robust contour detector. The caller always lets the user drag the
//     guessed corners to fix them, the same "auto-guess then adjust" model
//     real document-scanner apps use.
//   - extractPalette is a small from-scratch k-means over a pixel sample,
//     not a proper color-quantization library — plenty accurate for "pick
//     2-3 representative colors," which is all this needs.
// The perspective correction itself (computeHomography + warpPerspective)
// is a real general projective transform, solved via Gaussian elimination
// on the standard 8-unknown system for a quad-to-rectangle mapping.

import { rgbToHex } from "@/lib/color-convert";

export type Point = { x: number; y: number };
/** Corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Point, Point, Point, Point];

// ISO/IEC 7810 ID-1 — the physical size every payment/ID card is cut to
// (85.60mm x 53.98mm), so warping to this ratio matches a real card
// regardless of how the photo was framed.
export const CARD_ASPECT = 85.6 / 53.98;

export function defaultQuad(width: number, height: number): Quad {
  const mx = width * 0.06;
  const my = height * 0.06;
  return [
    { x: mx, y: my },
    { x: width - mx, y: my },
    { x: width - mx, y: height - my },
    { x: mx, y: height - my },
  ];
}

export function detectCardCorners(ctx: CanvasRenderingContext2D, width: number, height: number): Quad {
  const { data } = ctx.getImageData(0, 0, width, height);
  function luminance(x: number, y: number): number {
    const cx = Math.min(width - 1, Math.max(0, Math.round(x)));
    const cy = Math.min(height - 1, Math.max(0, Math.round(y)));
    const i = (cy * width + cx) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const corners: Point[] = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: width - 1, y: height - 1 },
    { x: 0, y: height - 1 },
  ];
  const center: Point = { x: width / 2, y: height / 2 };
  const maxT = 0.4;
  const steps = 50;

  return corners.map((corner) => {
    let prevLum = luminance(corner.x, corner.y);
    for (let s = 1; s <= steps; s++) {
      const t = (s / steps) * maxT;
      const x = corner.x + (center.x - corner.x) * t;
      const y = corner.y + (center.y - corner.y) * t;
      const lum = luminance(x, y);
      if (Math.abs(lum - prevLum) > 28) {
        const backT = Math.max(0, t - (maxT / steps) * 0.5);
        return { x: corner.x + (center.x - corner.x) * backT, y: corner.y + (center.y - corner.y) * backT };
      }
      prevLum = lum;
    }
    const fallbackT = 0.06;
    return { x: corner.x + (center.x - corner.x) * fallbackT, y: corner.y + (center.y - corner.y) * fallbackT };
  }) as Quad;
}

// Solves an 8x8 linear system via Gaussian elimination with partial
// pivoting — used for the homography's 8 unknowns (a projective transform
// has no closed-form solution the way an affine one does).
function solve8(rows: number[][], values: number[]): number[] {
  const n = 8;
  const m = rows.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const pv = m[col][col] || 1e-12;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col] / pv;
      for (let c = col; c <= n; c++) m[row][c] -= factor * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / (row[i] || 1e-12));
}

// Homography mapping dest-rectangle points (ox,oy) to source quad points:
// sx = (a*ox + b*oy + c) / (g*ox + h*oy + 1), sy analogous with d,e,f.
function computeHomography(dest: Quad, src: Quad): number[] {
  const rows: number[][] = [];
  const values: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x: ox, y: oy } = dest[i];
    const { x: sx, y: sy } = src[i];
    rows.push([ox, oy, 1, 0, 0, 0, -ox * sx, -oy * sx]);
    values.push(sx);
    rows.push([0, 0, 0, ox, oy, 1, -ox * sy, -oy * sy]);
    values.push(sy);
  }
  return solve8(rows, values);
}

export function warpPerspective(source: HTMLCanvasElement, quad: Quad, outWidth: number, outHeight: number): HTMLCanvasElement {
  const srcCtx = source.getContext("2d");
  if (!srcCtx) throw new Error("2D context unavailable");
  const srcData = srcCtx.getImageData(0, 0, source.width, source.height);

  const out = document.createElement("canvas");
  out.width = outWidth;
  out.height = outHeight;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("2D context unavailable");
  const outData = outCtx.createImageData(outWidth, outHeight);

  const destRect: Quad = [
    { x: 0, y: 0 },
    { x: outWidth, y: 0 },
    { x: outWidth, y: outHeight },
    { x: 0, y: outHeight },
  ];
  const [a, b, c, d, e, f, g, h] = computeHomography(destRect, quad);

  const sw = source.width;
  const sh = source.height;
  const sdata = srcData.data;

  function samplePixel(x: number, y: number): [number, number, number, number] {
    const cx = Math.min(sw - 1, Math.max(0, x));
    const cy = Math.min(sh - 1, Math.max(0, y));
    const i = (cy * sw + cx) * 4;
    return [sdata[i], sdata[i + 1], sdata[i + 2], sdata[i + 3]];
  }

  function sampleBilinear(sx: number, sy: number): [number, number, number, number] {
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const fx = sx - x0;
    const fy = sy - y0;
    const p00 = samplePixel(x0, y0);
    const p10 = samplePixel(x0 + 1, y0);
    const p01 = samplePixel(x0, y0 + 1);
    const p11 = samplePixel(x0 + 1, y0 + 1);
    const lerp = (v0: number, v1: number, t: number) => v0 + (v1 - v0) * t;
    const out: [number, number, number, number] = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
      const top = lerp(p00[k], p10[k], fx);
      const bot = lerp(p01[k], p11[k], fx);
      out[k] = lerp(top, bot, fy);
    }
    return out;
  }

  for (let oy = 0; oy < outHeight; oy++) {
    for (let ox = 0; ox < outWidth; ox++) {
      const denom = g * ox + h * oy + 1;
      const sx = (a * ox + b * oy + c) / denom;
      const sy = (d * ox + e * oy + f) / denom;
      const [r, gr, bl, al] = sampleBilinear(sx, sy);
      const oi = (oy * outWidth + ox) * 4;
      outData.data[oi] = r;
      outData.data[oi + 1] = gr;
      outData.data[oi + 2] = bl;
      outData.data[oi + 3] = al;
    }
  }
  outCtx.putImageData(outData, 0, 0);
  return out;
}

function dist2(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function average(points: [number, number, number][]): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of points) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  return [r / points.length, g / points.length, b / points.length];
}

// Small from-scratch k-means (see file header) — samples a grid of pixels
// rather than every pixel for speed, runs a fixed few iterations, and
// returns hex colors sorted by cluster size (most prevalent first).
export function extractPalette(canvas: HTMLCanvasElement, count: number): string[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 2000)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (samples.length === 0) return [];

  let centroids: [number, number, number][] = Array.from(
    { length: Math.min(count, samples.length) },
    (_, i) => samples[Math.floor((i * samples.length) / count)],
  );

  let assignments: number[] = [];
  for (let iter = 0; iter < 6; iter++) {
    assignments = samples.map((s) => {
      let best = 0;
      let bestDist = Infinity;
      for (let k = 0; k < centroids.length; k++) {
        const dd = dist2(s, centroids[k]);
        if (dd < bestDist) {
          bestDist = dd;
          best = k;
        }
      }
      return best;
    });
    const buckets: [number, number, number][][] = centroids.map(() => []);
    samples.forEach((s, i) => buckets[assignments[i]].push(s));
    centroids = centroids.map((c, k) => (buckets[k].length ? average(buckets[k]) : c));
  }

  const sizes = centroids.map((_, k) => assignments.filter((a) => a === k).length);
  const order = centroids.map((_, k) => k).sort((k1, k2) => sizes[k2] - sizes[k1]);
  return order.map((k) => rgbToHex({ r: Math.round(centroids[k][0]), g: Math.round(centroids[k][1]), b: Math.round(centroids[k][2]) }));
}
