import type { CSSProperties } from "react";
import type { MessageKey } from "@/lib/i18n/messages";

// Background treatments for card/pass visuals (WalletCardShape, PassShape,
// AccountCardShape) — the plain single-gradient look ("solid") stays the
// default and behind-the-scenes fallback (see the "solid" case below, which
// mirrors heroGradientClasses/colorHeroStyle in category-styles.ts exactly),
// while the other ten are pure-CSS patterns/gradients inspired by real card
// designs (metal-card sheen, neobank wave/dot motifs, geometric fintech
// cards, etc). Every pattern's colors are plain hex — never named palette
// tokens — since these render as raw inline CSS gradients that Tailwind
// can't express as build-time classes (same reasoning as colorHeroStyle).
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
};

export const COLOR_SLOT_LABEL_KEYS: MessageKey[] = ["background.colorSlot1", "background.colorSlot2", "background.colorSlot3"];

export type CardBackground = {
  pattern: CardPattern;
  /** Hex colors, one per PATTERN_COLOR_COUNT[pattern] slot. */
  colors: string[];
};

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
};

export function defaultCardBackground(pattern: CardPattern): CardBackground {
  return { pattern, colors: [...DEFAULT_COLORS[pattern]] };
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

// Tolerant parse for the JSON-in-TEXT column (same convention as
// normalizePassFields/normalizePassLayout in membership-templates.ts) —
// anything malformed, missing, or from an unrecognized pattern just falls
// back to null (render the plain solid-color path) rather than throwing.
export function normalizeCardBackground(raw: unknown): CardBackground | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
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

// Pure-CSS renderers, one per non-"solid" pattern — plain gradient
// functions so colors can be swapped at runtime via inline style, no SVG/
// canvas/image assets involved. "solid" isn't handled here: callers keep
// using heroGradientClasses/colorHeroStyle for it, same as before this
// system existed, so a card with no background set renders byte-identical
// to how it always has.
export function cardBackgroundStyle(bg: CardBackground): CSSProperties {
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
  }
}
