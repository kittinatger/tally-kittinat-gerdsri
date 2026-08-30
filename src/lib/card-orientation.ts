import type { MessageKey } from "@/lib/i18n/messages";

// Shared landscape/portrait orientation for every card-shaped visual —
// wallets (WalletCardShape/AccountCardShape), card templates
// (card_templates), and membership/pass cards (PassShape) — mirrors the
// badge-position.ts/chip-position.ts convention (enum + type guard +
// label keys + a default) so it isn't reinvented per feature.
export const CARD_ORIENTATIONS = ["landscape", "portrait"] as const;
export type CardOrientation = (typeof CARD_ORIENTATIONS)[number];

export function isCardOrientation(value: string): value is CardOrientation {
  return (CARD_ORIENTATIONS as readonly string[]).includes(value);
}

export const DEFAULT_CARD_ORIENTATION: CardOrientation = "landscape";

export const ORIENTATION_LABEL_KEYS: Record<CardOrientation, MessageKey> = {
  landscape: "wallet.orientationLandscape",
  portrait: "wallet.orientationPortrait",
};

// ISO/IEC 7810 ID-1 (85.60mm x 53.98mm) — the real physical card ratio —
// oriented either way. Single source of truth replacing the several
// independently-hardcoded `aspect-[1.586/1]` literals that existed before
// this file (WalletCardShape, AccountCardShape, TemplateEditModal).
export const CARD_ASPECT_RATIOS: Record<CardOrientation, number> = {
  landscape: 85.6 / 53.98,
  portrait: 53.98 / 85.6,
};

export const CARD_ASPECT_CLASSES: Record<CardOrientation, string> = {
  landscape: "aspect-[1.586/1]",
  portrait: "aspect-[1/1.586]",
};

// A floor on the card's *cross-axis* size for narrow containers — landscape
// needs a height floor (a very narrow column would otherwise flatten it),
// portrait needs a width floor instead (a very short row would otherwise
// squash it sideways).
export const CARD_MIN_SIZE_CLASSES: Record<CardOrientation, string> = {
  landscape: "min-h-[190px]",
  portrait: "min-w-[120px]",
};

// Width, alongside the aspect classes above — this is what actually makes
// "portrait" read as the *same physical card, turned 90°* instead of a
// taller card. `aspect-[1/1.586]` alone just inverts the ratio; combined
// with the same `w-full` landscape uses, that stretches a portrait card
// to be 1.586x *taller* than landscape at the same width, not the same
// card rotated. A true rotation swaps which side is full-width: landscape
// is full width with a shorter derived height; portrait needs to be
// full-width's worth of *height*, with a narrower derived width — i.e.
// its width should equal what landscape's height would have been at the
// same container width. 100% / 1.586 ≈ 63.05% is exactly that: a
// same-container-width portrait box at this width, times the portrait
// aspect ratio, works out to a height equal to the full container width
// (mirroring landscape's width : the roles of width/height are swapped,
// not just the ratio). `mx-auto` centers the now-narrower box in the
// row/column it shares with landscape cards.
export const CARD_WIDTH_CLASSES: Record<CardOrientation, string> = {
  landscape: "w-full",
  portrait: "mx-auto w-[63.05%]",
};
