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
