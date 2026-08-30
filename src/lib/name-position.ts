import type { MessageKey } from "@/lib/i18n/messages";

// Where the cardholder-name text sits on the card face — same four corners
// as badge-position.ts/chip-position.ts, and deliberately reusing that
// exact pattern rather than free-form x/y coordinates: it's simple, matches
// the picker UI the user already knows from the network badge and chip,
// and covers the actual need (letting a premade-card template like a
// transit-card design put the name wherever its artwork's own placeholder
// text used to sit, instead of always the default bottom-left row).
export const NAME_POSITIONS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;

export type NamePosition = (typeof NAME_POSITIONS)[number];

export function isNamePosition(value: string): value is NamePosition {
  return (NAME_POSITIONS as readonly string[]).includes(value);
}

// Matches the holder-name text's original always-bottom-left placement
// (inline in the bottom row next to the expiry date), so existing cards
// look unchanged until someone picks a different corner. See
// WalletCardShape.tsx: at this default, the name stays inline in its
// original row rather than becoming a free-floating corner element, so the
// only actual behavior change for every existing card is zero.
export const DEFAULT_NAME_POSITION: NamePosition = "bottomLeft";

export const NAME_POSITION_LABEL_KEYS: Record<NamePosition, MessageKey> = {
  topLeft: "wallet.badgePositionTopLeft",
  topRight: "wallet.badgePositionTopRight",
  bottomLeft: "wallet.badgePositionBottomLeft",
  bottomRight: "wallet.badgePositionBottomRight",
};

// Same corner-inset classes as BADGE_POSITION_CLASSES — the card container
// is `relative` with p-4, so these line up flush with the badge/chip/label.
export const NAME_POSITION_CLASSES: Record<NamePosition, string> = {
  topLeft: "top-4 left-4",
  topRight: "top-4 right-4",
  bottomLeft: "bottom-4 left-4",
  bottomRight: "bottom-4 right-4",
};
