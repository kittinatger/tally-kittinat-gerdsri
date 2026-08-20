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
// the "inspired by real card designs" original ten. Every pattern's colors
// are plain hex — never named palette tokens — since these render as raw
// inline CSS/SVG that Tailwind can't express as build-time classes (same
// reasoning as colorHeroStyle).
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
