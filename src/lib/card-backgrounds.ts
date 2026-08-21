import type { CSSProperties } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { isHexColor, hexToRgb } from "@/lib/color-convert";

// Background treatments for card/pass visuals (WalletCardShape, PassShape,
// AccountCardShape) — the plain single-gradient look ("solid") stays the
// default and behind-the-scenes fallback (see the "solid" case below, which
// mirrors heroGradientClasses/colorHeroStyle in category-styles.ts exactly).
// Of the rest: ten are pure-CSS gradients/textures inspired by real card
// designs (metal-card sheen, neobank wave/dot motifs, geometric fintech
// cards, etc), six (diagonalSplit through colorBlocks) are original SVG
// shape illustrations — folded ribbons, interlocking rings, a spiral, a
// soft radial burst, geometric color blocks — in the style of abstract
// wallpaper art, and six more (brushedMetal through microEmboss) are
// original textures evoking the general *finish* of premium payment cards
// — anodized/brushed metal, engine-turned (guilloché) engraving, a woven
// carbon-fiber weave, concentric rings, an iridescent holo sheen, and a
// fine embossed dot grid. None of the six reproduce any network's actual
// logo, wordmark, hologram/dove/centurion artwork, or a specific brand's
// signature color combination — only the material/texture language common
// across many premium cards in general, same non-brand-specific spirit as
// the "inspired by real card designs" original ten. Eight more
// (scallopWave through speckleSplash) are original shape illustrations in
// the general style of colorful neobank/fintech card art — scalloped wave
// bands, overlapping petal blooms, floating rotated squares, a scattered
// oval cluster, angular color shards, an organic ink blob, a marbled
// swirl, and a paint-speckle texture — again none of them reproduce any
// bank's name, wordmark, or logo mark, only the general abstract-shape
// aesthetic. 22 more (auroraHalo through flameGradient) round out the
// gallery with further original motifs common across fintech card art —
// glow/halo blurs, circuit traces, neon ribbons, faceted/prism shards,
// folded banners, fine line/lattice/hex textures, bold silhouettes
// (teardrop, bolt, ink splatter), radiating rays and arcs, a pixel
// mosaic, and warm gradient swooshes — same rule as every pattern above:
// original artwork only, never a specific brand's name/wordmark/logo.
// Every pattern's colors are plain hex — never named palette tokens —
// since these render as raw inline CSS/SVG that Tailwind can't express as
// build-time classes (same reasoning as colorHeroStyle).
export const CARD_PATTERNS = [
  "solid",
  "diagonal",
  "radialGlow",
  "wave",
  "dots",
  "stripes",
  "triangles",
  "grid",
  "sheen",
  "topographic",
  "confetti",
  "diagonalSplit",
  "ribbonFold",
  "loopKnot",
  "spiralCoil",
  "radialBurst",
  "colorBlocks",
  "brushedMetal",
  "guilloche",
  "carbonFiber",
  "concentricRings",
  "holoWave",
  "microEmboss",
  "scallopWave",
  "petalBloom",
  "floatingSquares",
  "ovalCluster",
  "fragmentShards",
  "inkBlob",
  "marbleSwirl",
  "speckleSplash",
  "auroraHalo",
  "circuitMaze",
  "neonRibbon",
  "prismShard",
  "bannerFold",
  "wavyLines",
  "tearDrop",
  "chevronBolt",
  "cosmicStreak",
  "diagonalGrain",
  "liquidRibbon",
  "halfMoonGlow",
  "inkSplatter",
  "diamondLattice",
  "sunburstRays",
  "zigzagPulse",
  "hexGrid",
  "gemFacet",
  "cloudDrift",
  "arcBands",
  "pixelMosaic",
  "flameGradient",
] as const;

export type CardPattern = (typeof CARD_PATTERNS)[number];

export function isCardPattern(value: string): value is CardPattern {
  return (CARD_PATTERNS as readonly string[]).includes(value);
}

// The ten selectable patterns shown in CardBackgroundPicker's gallery —
// "solid" is reached via the picker's separate "Plain color" swatch, which
// falls back to the original single-ColorPicker flow instead of this system.
export const GALLERY_PATTERNS: CardPattern[] = CARD_PATTERNS.filter((p) => p !== "solid") as CardPattern[];

export const PATTERN_COLOR_COUNT: Record<CardPattern, number> = {
  solid: 1,
  diagonal: 2,
  radialGlow: 2,
  wave: 2,
  dots: 2,
  stripes: 2,
  triangles: 3,
  grid: 2,
  sheen: 2,
  topographic: 2,
  confetti: 3,
  diagonalSplit: 2,
  ribbonFold: 2,
  loopKnot: 3,
  spiralCoil: 3,
  radialBurst: 3,
  colorBlocks: 3,
  brushedMetal: 2,
  guilloche: 2,
  carbonFiber: 2,
  concentricRings: 2,
  holoWave: 3,
  microEmboss: 2,
  scallopWave: 2,
  petalBloom: 3,
  floatingSquares: 3,
  ovalCluster: 2,
  fragmentShards: 3,
  inkBlob: 2,
  marbleSwirl: 2,
  speckleSplash: 2,
  auroraHalo: 2,
  circuitMaze: 2,
  neonRibbon: 2,
  prismShard: 3,
  bannerFold: 3,
  wavyLines: 2,
  tearDrop: 2,
  chevronBolt: 2,
  cosmicStreak: 2,
  diagonalGrain: 2,
  liquidRibbon: 3,
  halfMoonGlow: 2,
  inkSplatter: 2,
  diamondLattice: 2,
  sunburstRays: 2,
  zigzagPulse: 2,
  hexGrid: 2,
  gemFacet: 3,
  cloudDrift: 2,
  arcBands: 2,
  pixelMosaic: 3,
  flameGradient: 2,
};

export const PATTERN_LABEL_KEYS: Partial<Record<CardPattern, MessageKey>> = {
  diagonal: "background.patternDiagonal",
  radialGlow: "background.patternRadialGlow",
  wave: "background.patternWave",
  dots: "background.patternDots",
  stripes: "background.patternStripes",
  triangles: "background.patternTriangles",
  grid: "background.patternGrid",
  sheen: "background.patternSheen",
  topographic: "background.patternTopographic",
  confetti: "background.patternConfetti",
  diagonalSplit: "background.patternDiagonalSplit",
  ribbonFold: "background.patternRibbonFold",
  loopKnot: "background.patternLoopKnot",
  spiralCoil: "background.patternSpiralCoil",
  radialBurst: "background.patternRadialBurst",
  colorBlocks: "background.patternColorBlocks",
  brushedMetal: "background.patternBrushedMetal",
  guilloche: "background.patternGuilloche",
  carbonFiber: "background.patternCarbonFiber",
  concentricRings: "background.patternConcentricRings",
  holoWave: "background.patternHoloWave",
  microEmboss: "background.patternMicroEmboss",
  scallopWave: "background.patternScallopWave",
  petalBloom: "background.patternPetalBloom",
  floatingSquares: "background.patternFloatingSquares",
  ovalCluster: "background.patternOvalCluster",
  fragmentShards: "background.patternFragmentShards",
  inkBlob: "background.patternInkBlob",
  marbleSwirl: "background.patternMarbleSwirl",
  speckleSplash: "background.patternSpeckleSplash",
  auroraHalo: "background.patternAuroraHalo",
  circuitMaze: "background.patternCircuitMaze",
  neonRibbon: "background.patternNeonRibbon",
  prismShard: "background.patternPrismShard",
  bannerFold: "background.patternBannerFold",
  wavyLines: "background.patternWavyLines",
  tearDrop: "background.patternTearDrop",
  chevronBolt: "background.patternChevronBolt",
  cosmicStreak: "background.patternCosmicStreak",
  diagonalGrain: "background.patternDiagonalGrain",
  liquidRibbon: "background.patternLiquidRibbon",
  halfMoonGlow: "background.patternHalfMoonGlow",
  inkSplatter: "background.patternInkSplatter",
  diamondLattice: "background.patternDiamondLattice",
  sunburstRays: "background.patternSunburstRays",
  zigzagPulse: "background.patternZigzagPulse",
  hexGrid: "background.patternHexGrid",
  gemFacet: "background.patternGemFacet",
  cloudDrift: "background.patternCloudDrift",
  arcBands: "background.patternArcBands",
  pixelMosaic: "background.patternPixelMosaic",
  flameGradient: "background.patternFlameGradient",
};

export const COLOR_SLOT_LABEL_KEYS: MessageKey[] = ["background.colorSlot1", "background.colorSlot2", "background.colorSlot3"];

// A literal image background — either the corrected photo from "Scan a
// card" used as-is, or an AI-generated pattern derived from it (see
// CardPhotoScanModal.tsx). Both are "just an image", so they share this one
// variant rather than needing two — the distinction (real photo vs.
// AI-generated) only matters at the point the image was produced, not for
// how it's stored or rendered. `pattern` stays the single discriminant
// field (rather than a separate `kind`) so existing saved CSS-pattern
// backgrounds — which only ever had `pattern` in CardPattern — keep parsing
// unchanged; "photo" was never a valid CardPattern before this.
export type CardBackground = { pattern: CardPattern; colors: string[] } | { pattern: "photo"; photoDataUrl: string };

const DEFAULT_COLORS: Record<CardPattern, string[]> = {
  solid: ["#f43f5e"],
  diagonal: ["#f43f5e", "#be123c"],
  radialGlow: ["#4338ca", "#818cf8"],
  wave: ["#0f766e", "#5eead4"],
  dots: ["#1e293b", "#64748b"],
  stripes: ["#b45309", "#fbbf24"],
  triangles: ["#111827", "#6366f1", "#ec4899"],
  grid: ["#0c4a6e", "#38bdf8"],
  sheen: ["#334155", "#e2e8f0"],
  topographic: ["#166534", "#86efac"],
  confetti: ["#7c3aed", "#f472b6", "#facc15"],
  diagonalSplit: ["#a3e635", "#16a34a"],
  ribbonFold: ["#7c3aed", "#2dd4bf"],
  loopKnot: ["#ffffff", "#ef4444", "#7c3aed"],
  spiralCoil: ["#ffffff", "#db2777", "#2563eb"],
  radialBurst: ["#2563eb", "#f59e0b", "#16a34a"],
  colorBlocks: ["#f97316", "#1d4ed8", "#facc15"],
  brushedMetal: ["#94a3b8", "#f8fafc"],
  guilloche: ["#0f172a", "#64748b"],
  carbonFiber: ["#111827", "#1f2937"],
  concentricRings: ["#1e3a8a", "#93c5fd"],
  holoWave: ["#7c3aed", "#ec4899", "#06b6d4"],
  microEmboss: ["#78350f", "#fde68a"],
  scallopWave: ["#dc2626", "#7c3aed"],
  petalBloom: ["#ef4444", "#f472b6", "#60a5fa"],
  floatingSquares: ["#0d9488", "#1d4ed8", "#f97316"],
  ovalCluster: ["#f5d0fe", "#4c1d95"],
  fragmentShards: ["#fef08a", "#db2777", "#94a3b8"],
  inkBlob: ["#0f172a", "#f97316"],
  marbleSwirl: ["#0f766e", "#facc15"],
  speckleSplash: ["#111827", "#f8fafc"],
  auroraHalo: ["#0a0a0a", "#22d3ee"],
  circuitMaze: ["#0f172a", "#f59e0b"],
  neonRibbon: ["#0a0a12", "#22d3ee"],
  prismShard: ["#0a0a0a", "#dc2626", "#16a34a"],
  bannerFold: ["#fbbf24", "#f8fafc", "#9ca3af"],
  wavyLines: ["#fb7185", "#ffffff"],
  tearDrop: ["#a78bfa", "#6b7280"],
  chevronBolt: ["#1e3a8a", "#3b82f6"],
  cosmicStreak: ["#581c87", "#a855f7"],
  diagonalGrain: ["#1e293b", "#64748b"],
  liquidRibbon: ["#1e1b4b", "#7c3aed", "#38bdf8"],
  halfMoonGlow: ["#111827", "#ec4899"],
  inkSplatter: ["#f8fafc", "#111827"],
  diamondLattice: ["#0c4a6e", "#7dd3fc"],
  sunburstRays: ["#7c2d12", "#fb923c"],
  zigzagPulse: ["#111827", "#22c55e"],
  hexGrid: ["#134e4a", "#5eead4"],
  gemFacet: ["#1e1b4b", "#818cf8", "#c4b5fd"],
  cloudDrift: ["#f0f9ff", "#93c5fd"],
  arcBands: ["#78350f", "#fbbf24"],
  pixelMosaic: ["#111827", "#f43f5e", "#eab308"],
  flameGradient: ["#7f1d1d", "#f97316"],
};

export function defaultCardBackground(pattern: CardPattern): CardBackground {
  return { pattern, colors: [...DEFAULT_COLORS[pattern]] };
}

// The color ColorGlowPreview should glow behind a card — its own first
// color for a CSS pattern, or the caller's plain `color` for a photo
// background (a photo has no discrete "color" to pull one out of) or when
// no background is set at all.
export function backgroundGlowColor(bg: CardBackground | null, fallbackColor: string): string {
  if (!bg || bg.pattern === "photo") return fallbackColor;
  return bg.colors[0];
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

// Tolerant parse for the JSON-in-TEXT column (same convention as
// normalizePassFields/normalizePassLayout in membership-templates.ts) —
// anything malformed, missing, or from an unrecognized pattern just falls
// back to null (render the plain solid-color path) rather than throwing.
export function normalizeCardBackground(raw: unknown): CardBackground | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.pattern === "photo") {
    const url = typeof obj.photoDataUrl === "string" && obj.photoDataUrl.startsWith("data:image/") ? obj.photoDataUrl : null;
    return url ? { pattern: "photo", photoDataUrl: url } : null;
  }

  const pattern = typeof obj.pattern === "string" && isCardPattern(obj.pattern) ? obj.pattern : null;
  if (!pattern || pattern === "solid") return null;
  const need = PATTERN_COLOR_COUNT[pattern];
  const rawColors = Array.isArray(obj.colors)
    ? obj.colors.filter((c): c is string => typeof c === "string" && HEX_RE.test(c))
    : [];
  const fallback = DEFAULT_COLORS[pattern];
  const colors = Array.from({ length: need }, (_, i) => rawColors[i] ?? fallback[i]);
  return { pattern, colors };
}

export function parseCardBackground(text: string | null | undefined): CardBackground | null {
  if (!text) return null;
  try {
    return normalizeCardBackground(JSON.parse(text));
  } catch {
    return null;
  }
}

// Wraps original, non-brand SVG artwork (see the six shape-based patterns
// below) as a data-URI background-image — same rendering path as the
// pure-CSS gradient patterns (still just a CSSProperties object), so
// callers never need to know which patterns are gradients and which are
// vector shapes.
function svgBackground(markup: string): CSSProperties {
  return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(markup)}")`, backgroundSize: "cover", backgroundPosition: "center" };
}

// Pure-CSS renderers for most patterns — plain gradient functions so colors
// can be swapped at runtime via inline style. Some patterns (diagonalSplit
// through colorBlocks, plus guilloche/carbonFiber/concentricRings) are
// instead small original SVG illustrations recolored the same way. "solid"
// isn't handled here: callers keep using heroGradientClasses/colorHeroStyle
// for it, same as before this system existed, so a card with no background
// set renders byte-identical to how it always has.
export function cardBackgroundStyle(bg: CardBackground): CSSProperties {
  if (bg.pattern === "photo") {
    return { backgroundImage: `url(${bg.photoDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const [c0, c1, c2] = bg.colors;
  switch (bg.pattern) {
    case "diagonal":
      return { backgroundImage: `linear-gradient(135deg, ${c0}, ${c1})` };
    case "radialGlow":
      return {
        backgroundImage: `radial-gradient(120% 120% at 12% 12%, ${c1} 0%, transparent 55%), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "wave":
      return {
        backgroundImage: `radial-gradient(120% 60% at 30% 125%, ${c1} 40%, transparent 42%), radial-gradient(120% 60% at 85% 135%, ${c1} 40%, transparent 42%), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(${c1} 1.4px, transparent 1.4px)`,
        backgroundSize: "14px 14px",
        backgroundColor: c0,
      };
    case "stripes":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c1}33 0 6px, transparent 6px 16px), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "triangles":
      return {
        backgroundImage: `conic-gradient(from 225deg at 100% 0%, ${c1} 0deg 90deg, transparent 90deg), conic-gradient(from 45deg at 0% 100%, ${c2} 0deg 90deg, transparent 90deg), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${c1}55 1px, transparent 1px), linear-gradient(90deg, ${c1}55 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
        backgroundColor: c0,
      };
    case "sheen":
      return {
        backgroundImage: `linear-gradient(120deg, transparent 25%, ${c1}66 45%, transparent 62%), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "topographic":
      return {
        backgroundImage: `repeating-radial-gradient(circle at 75% 25%, transparent 0 8px, ${c1}40 8px 9px, transparent 9px 18px), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "confetti":
      return {
        backgroundImage: `radial-gradient(circle at 15% 25%, ${c1} 0 4px, transparent 4px), radial-gradient(circle at 70% 15%, ${c2} 0 3px, transparent 3px), radial-gradient(circle at 85% 60%, ${c1} 0 3px, transparent 3px), radial-gradient(circle at 30% 78%, ${c2} 0 4px, transparent 4px), radial-gradient(circle at 55% 45%, ${c1} 0 2.5px, transparent 2.5px), radial-gradient(circle at 90% 90%, ${c2} 0 2.5px, transparent 2.5px), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "solid":
      return { backgroundImage: `linear-gradient(to bottom right, ${c0}, ${c0})` };
    case "diagonalSplit":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="0,0 300,190 0,190" fill="${c1}"/></svg>`,
      );
    case "ribbonFold":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M60 40 L220 40 L60 150 L220 150" fill="none" stroke="${c1}" stroke-width="55" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      );
    case "loopKnot":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><circle cx="190" cy="60" r="35" fill="none" stroke="${c1}" stroke-width="26"/><circle cx="110" cy="130" r="35" fill="none" stroke="${c2}" stroke-width="26"/></svg>`,
      );
    case "spiralCoil":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><circle cx="230" cy="40" r="28" fill="none" stroke="${c1}" stroke-width="20"/><circle cx="180" cy="90" r="24" fill="none" stroke="${c2}" stroke-width="18"/><circle cx="140" cy="140" r="20" fill="none" stroke="${c1}" stroke-width="16"/></svg>`,
      );
    case "radialBurst":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="35"/></filter></defs><rect width="300" height="190" fill="${c0}"/><circle cx="40" cy="30" r="70" fill="${c1}" filter="url(#b)"/><circle cx="260" cy="160" r="70" fill="${c2}" filter="url(#b)"/></svg>`,
      );
    case "colorBlocks":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c2}"/><rect width="150" height="95" fill="${c0}"/><rect x="150" width="150" height="95" fill="${c1}"/><circle cx="150" cy="95" r="45" fill="${c2}"/></svg>`,
      );
    case "brushedMetal":
      return {
        backgroundImage: `repeating-linear-gradient(100deg, ${c1}26 0px, transparent 1px, transparent 3px), linear-gradient(115deg, transparent 30%, ${c1}66 48%, transparent 66%), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "guilloche":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="none" stroke="${c1}" stroke-width="1" opacity="0.55"><path d="M-10 15 C 40 55, 80 -25, 130 15 S 220 55, 310 15"/><path d="M-10 45 C 40 85, 80 5, 130 45 S 220 85, 310 45"/><path d="M-10 75 C 40 115, 80 35, 130 75 S 220 115, 310 75"/><path d="M-10 105 C 40 145, 80 65, 130 105 S 220 145, 310 105"/><path d="M-10 135 C 40 175, 80 95, 130 135 S 220 175, 310 135"/><path d="M-10 165 C 40 205, 80 125, 130 165 S 220 205, 310 165"/></g></svg>`,
      );
    case "carbonFiber":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><pattern id="cf" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="${c0}"/><rect width="6" height="6" fill="${c1}"/><rect x="6" y="6" width="6" height="6" fill="${c1}"/></pattern></defs><rect width="300" height="190" fill="url(#cf)"/></svg>`,
      );
    case "concentricRings":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="none" stroke="${c1}" stroke-width="2" opacity="0.55"><circle cx="230" cy="55" r="20"/><circle cx="230" cy="55" r="40"/><circle cx="230" cy="55" r="60"/><circle cx="230" cy="55" r="80"/><circle cx="230" cy="55" r="100"/></g></svg>`,
      );
    case "holoWave":
      return {
        backgroundImage: `linear-gradient(120deg, ${c0} 0%, ${c1} 35%, ${c2} 60%, ${c0} 100%), linear-gradient(75deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)`,
      };
    case "microEmboss":
      return {
        backgroundImage: `radial-gradient(circle at 30% 30%, ${c1}cc 0.6px, transparent 0.6px), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.25) 0.6px, transparent 0.6px), linear-gradient(135deg, ${c0}, ${c0})`,
        backgroundSize: "6px 6px, 6px 6px, 100% 100%",
      };
    case "scallopWave":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M0 40 Q37.5 0 75 40 T150 40 T225 40 T300 40 V190 H0 Z" fill="${c1}"/></svg>`,
      );
    case "petalBloom":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><ellipse cx="150" cy="70" rx="70" ry="90" fill="${c1}" transform="rotate(-20 150 70)"/><ellipse cx="190" cy="40" rx="35" ry="50" fill="${c2}" transform="rotate(30 190 40)"/><ellipse cx="110" cy="30" rx="30" ry="45" fill="${c2}" transform="rotate(-60 110 30)"/></svg>`,
      );
    case "floatingSquares":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g opacity="0.85"><rect x="40" y="20" width="70" height="70" fill="${c1}" transform="rotate(15 75 55)"/><rect x="150" y="60" width="90" height="90" fill="${c2}" transform="rotate(-10 195 105)"/><rect x="90" y="90" width="60" height="60" fill="${c1}" transform="rotate(25 120 120)"/></g><path d="M20 150 C 80 110, 120 190, 180 130 S 260 60, 290 100" fill="none" stroke="${c2}" stroke-width="3" opacity="0.7"/></svg>`,
      );
    case "ovalCluster":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="${c1}" opacity="0.85"><ellipse cx="40" cy="30" rx="22" ry="14" transform="rotate(20 40 30)"/><ellipse cx="90" cy="20" rx="16" ry="10" transform="rotate(-10 90 20)"/><ellipse cx="150" cy="45" rx="24" ry="15" transform="rotate(35 150 45)"/><ellipse cx="220" cy="25" rx="18" ry="12" transform="rotate(-25 220 25)"/><ellipse cx="270" cy="55" rx="20" ry="13" transform="rotate(15 270 55)"/><ellipse cx="55" cy="90" rx="20" ry="13" transform="rotate(-15 55 90)"/><ellipse cx="120" cy="100" rx="26" ry="16" transform="rotate(10 120 100)"/><ellipse cx="190" cy="95" rx="18" ry="12" transform="rotate(-30 190 95)"/><ellipse cx="250" cy="115" rx="22" ry="14" transform="rotate(20 250 115)"/><ellipse cx="80" cy="150" rx="22" ry="14" transform="rotate(-20 80 150)"/><ellipse cx="160" cy="160" rx="20" ry="13" transform="rotate(25 160 160)"/><ellipse cx="230" cy="165" rx="18" ry="12" transform="rotate(-10 230 165)"/></g></svg>`,
      );
    case "fragmentShards":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="0,0 150,0 90,95" fill="${c1}"/><polygon points="150,0 300,0 300,60 210,95" fill="${c2}"/><polygon points="0,190 130,95 0,60" fill="${c2}"/><polygon points="300,190 150,190 210,95 300,140" fill="${c1}"/></svg>`,
      );
    case "inkBlob":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M40 60 C 10 90, 30 140, 80 150 C 130 160, 140 110, 180 100 C 230 90, 250 40, 200 20 C 150 0, 120 40, 80 30 C 50 22, 60 40, 40 60 Z" fill="${c1}"/></svg>`,
      );
    case "marbleSwirl":
      return {
        backgroundImage: `conic-gradient(from 200deg at 30% 40%, ${c0}, ${c1}, ${c0} 60%, ${c1} 80%, ${c0}), radial-gradient(60% 50% at 70% 70%, ${c1}55, transparent 60%)`,
      };
    case "speckleSplash":
      return {
        backgroundImage: `radial-gradient(circle at 12% 22%, ${c1} 0 2px, transparent 2px), radial-gradient(circle at 34% 8%, ${c1} 0 1.5px, transparent 1.5px), radial-gradient(circle at 58% 30%, ${c1} 0 2.5px, transparent 2.5px), radial-gradient(circle at 75% 12%, ${c1} 0 1px, transparent 1px), radial-gradient(circle at 20% 55%, ${c1} 0 1.5px, transparent 1.5px), radial-gradient(circle at 45% 65%, ${c1} 0 2px, transparent 2px), radial-gradient(circle at 68% 50%, ${c1} 0 1px, transparent 1px), radial-gradient(circle at 88% 60%, ${c1} 0 2px, transparent 2px), radial-gradient(circle at 30% 85%, ${c1} 0 1.5px, transparent 1.5px), radial-gradient(circle at 55% 90%, ${c1} 0 1px, transparent 1px), radial-gradient(circle at 80% 82%, ${c1} 0 2px, transparent 2px), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "auroraHalo":
      return {
        backgroundImage: `radial-gradient(60% 50% at 50% 100%, ${c1} 0%, transparent 70%), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "circuitMaze":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="none" stroke="${c1}" stroke-width="2" opacity="0.7"><path d="M20 20 H100 V60 H180 V20 H260"/><path d="M20 60 H60 V100 H140 V140 H220 V100 H260"/><path d="M20 140 H100 V170 H200"/><circle cx="100" cy="60" r="3" fill="${c1}"/><circle cx="180" cy="20" r="3" fill="${c1}"/><circle cx="140" cy="140" r="3" fill="${c1}"/></g></svg>`,
      );
    case "neonRibbon":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M-20 140 C 60 80, 100 180, 180 110 S 320 40, 340 90" fill="none" stroke="${c1}" stroke-width="30" stroke-linecap="round" opacity="0.3"/><path d="M-20 140 C 60 80, 100 180, 180 110 S 320 40, 340 90" fill="none" stroke="${c1}" stroke-width="14" stroke-linecap="round" opacity="0.85"/></svg>`,
      );
    case "prismShard":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="0,190 90,60 140,190" fill="${c1}"/><polygon points="140,190 190,90 260,190" fill="${c2}"/></svg>`,
      );
    case "bannerFold":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="0,0 220,0 60,190 0,190" fill="${c1}"/><polygon points="220,0 300,0 300,90 100,190 60,190" fill="${c2}"/></svg>`,
      );
    case "wavyLines":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><pattern id="wl" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q7.5 0 15 10 T30 10" fill="none" stroke="${c1}" stroke-width="1" opacity="0.55"/></pattern></defs><rect width="300" height="190" fill="${c0}"/><rect width="300" height="190" fill="url(#wl)"/></svg>`,
      );
    case "tearDrop":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M150 20 C 210 60, 230 120, 150 170 C 70 120, 90 60, 150 20 Z" fill="${c1}"/></svg>`,
      );
    case "chevronBolt":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="170,10 90,110 140,110 110,180 220,80 170,80 200,10" fill="${c1}"/></svg>`,
      );
    case "cosmicStreak":
      return {
        backgroundImage: `radial-gradient(70% 60% at 30% 90%, ${c1} 0%, transparent 60%), linear-gradient(135deg, ${c0}, ${c0}), linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.85) 21%, transparent 22%)`,
      };
    case "diagonalGrain":
      return {
        backgroundImage: `repeating-linear-gradient(60deg, ${c1}22 0px, transparent 1px, transparent 4px), linear-gradient(200deg, ${c0}, ${c1}33, ${c0})`,
      };
    case "liquidRibbon":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><path d="M-20 60 C 60 20, 100 100, 180 60 S 320 20, 340 60 L 340 190 L -20 190 Z" fill="${c1}" opacity="0.85"/><path d="M-20 100 C 60 60, 100 140, 180 100 S 320 60, 340 100 L 340 190 L -20 190 Z" fill="${c2}" opacity="0.75"/></svg>`,
      );
    case "halfMoonGlow":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><filter id="hb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="300" height="190" fill="${c0}"/><circle cx="150" cy="220" r="90" fill="${c1}" filter="url(#hb)"/></svg>`,
      );
    case "inkSplatter":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="${c1}"><circle cx="110" cy="90" r="55"/><circle cx="170" cy="50" r="14"/><circle cx="200" cy="110" r="10"/><circle cx="90" cy="150" r="8"/><circle cx="230" cy="70" r="6"/><circle cx="60" cy="60" r="6"/></g></svg>`,
      );
    case "diamondLattice":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><pattern id="dl" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M15 0 L30 15 L15 30 L0 15 Z" fill="none" stroke="${c1}" stroke-width="1.2" opacity="0.5"/></pattern></defs><rect width="300" height="190" fill="${c0}"/><rect width="300" height="190" fill="url(#dl)"/></svg>`,
      );
    case "sunburstRays":
      return {
        backgroundImage: `repeating-conic-gradient(from 0deg at 0% 0%, ${c1}33 0deg 4deg, transparent 4deg 12deg), linear-gradient(135deg, ${c0}, ${c0})`,
      };
    case "zigzagPulse":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polyline points="0,100 60,100 80,40 100,160 120,100 300,100" fill="none" stroke="${c1}" stroke-width="4" opacity="0.8"/></svg>`,
      );
    case "hexGrid":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><pattern id="hx" width="26" height="30" patternUnits="userSpaceOnUse"><polygon points="13,0 26,7.5 26,22.5 13,30 0,22.5 0,7.5" fill="none" stroke="${c1}" stroke-width="1" opacity="0.45"/></pattern></defs><rect width="300" height="190" fill="${c0}"/><rect width="300" height="190" fill="url(#hx)"/></svg>`,
      );
    case "gemFacet":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><polygon points="150,20 210,70 180,150 120,150 90,70" fill="${c1}" opacity="0.85"/><polygon points="150,20 210,70 150,90" fill="${c2}" opacity="0.9"/><polygon points="90,70 150,90 120,150" fill="${c2}" opacity="0.6"/></svg>`,
      );
    case "cloudDrift":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><filter id="cb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter></defs><rect width="300" height="190" fill="${c0}"/><ellipse cx="80" cy="60" rx="70" ry="40" fill="${c1}" filter="url(#cb)"/><ellipse cx="220" cy="130" rx="80" ry="45" fill="${c1}" filter="url(#cb)" opacity="0.7"/></svg>`,
      );
    case "arcBands":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="${c0}"/><g fill="none" stroke="${c1}" stroke-width="10" opacity="0.5"><path d="M300,190 A 60 60 0 0 0 240,130"/><path d="M300,190 A 100 100 0 0 0 200,90"/><path d="M300,190 A 140 140 0 0 0 160,50"/><path d="M300,190 A 180 180 0 0 0 120,10"/></g></svg>`,
      );
    case "pixelMosaic":
      return svgBackground(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><defs><pattern id="pm" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${c0}"/><rect width="12" height="12" fill="${c1}"/><rect x="12" y="12" width="12" height="12" fill="${c2}"/></pattern></defs><rect width="300" height="190" fill="url(#pm)"/></svg>`,
      );
    case "flameGradient":
      return {
        backgroundImage: `radial-gradient(60% 90% at 30% 100%, ${c1} 0%, transparent 60%), radial-gradient(50% 70% at 65% 100%, ${c1} 0%, transparent 55%), linear-gradient(180deg, ${c0}, ${c0})`,
      };
  }
}

// ---- Text color (auto-contrast, with an optional manual override) --------

// Simple relative-luminance check (perceptual weighting, not true WCAG
// contrast ratio — plenty accurate for picking "light or dark text" against
// a single representative background color, which is all this needs).
export function contrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// The full set of opacities the card shapes actually use (their labels vs.
// values vs. dividers) — computed once per base color so callers never
// re-derive rgba strings by hand. Tailwind's `text-white/70`-style opacity
// utilities only work for literal white, so once the base can be any
// runtime color, every one of those becomes an inline style instead.
export type CardForeground = { full: string; a85: string; a70: string; a60: string; a40: string; a30: string; a20: string };

function cardForeground(base: string): CardForeground {
  return {
    full: base,
    a85: withAlpha(base, 0.85),
    a70: withAlpha(base, 0.7),
    a60: withAlpha(base, 0.6),
    a40: withAlpha(base, 0.4),
    a30: withAlpha(base, 0.3),
    a20: withAlpha(base, 0.2),
  };
}

// Resolves what a card's text/foreground chrome should be: an explicit
// manual override if one is set, otherwise auto-contrast against the
// card's own background. A pattern's own `colors[0]` is its base/dominant
// color, so that's what gets tested; a photo background has no single
// representative color to test, so it keeps the white-text default that
// every card had before this existed (still overridable manually). A named
// palette token (e.g. "emerald") isn't tested either — that curated
// palette was already chosen to read well with white text, unlike an
// arbitrary user-picked hex, which might be light.
export function cardForegroundFor(
  explicitTextColor: string | null | undefined,
  background: CardBackground | null,
  plainColor: string,
): CardForeground {
  if (explicitTextColor) return cardForeground(explicitTextColor);
  if (background) {
    return cardForeground(background.pattern === "photo" ? "#ffffff" : contrastTextColor(background.colors[0]));
  }
  return cardForeground(isHexColor(plainColor) ? contrastTextColor(plainColor) : "#ffffff");
}
