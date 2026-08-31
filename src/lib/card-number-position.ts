import type { MessageKey } from "@/lib/i18n/messages";

// Where the masked card-number row (see WalletCardShape.tsx) sits on the
// card face — full-width, unlike the chip's single left-anchored spot,
// since it's a line of text rather than a small icon.
export const CARD_NUMBER_POSITIONS = ["top", "middle", "bottom"] as const;

export type CardNumberPosition = (typeof CARD_NUMBER_POSITIONS)[number];

export function isCardNumberPosition(value: string): value is CardNumberPosition {
  return (CARD_NUMBER_POSITIONS as readonly string[]).includes(value);
}

// Default for newly-created wallets — vertically centered, same as the
// chip's own default position, so the two line up together out of the box
// instead of the number defaulting to "top" (its original, no-longer-
// default inline spot) while the chip defaults to the middle.
export const DEFAULT_CARD_NUMBER_POSITION: CardNumberPosition = "middle";

export const CARD_NUMBER_POSITION_LABEL_KEYS: Record<CardNumberPosition, MessageKey> = {
  top: "wallet.chipPositionTop",
  middle: "wallet.chipPositionMiddle",
  bottom: "wallet.chipPositionBottom",
};

// Only "middle"/"bottom" need anchor classes — "top" stays inline in its
// original row (see the nameInCorner precedent in WalletCardShape.tsx)
// rather than becoming a free-floating element, so a wallet already
// explicitly set to "top" keeps its layout unchanged.
export const CARD_NUMBER_POSITION_CLASSES: Record<"middle" | "bottom", string> = {
  middle: "top-1/2 left-4 right-4 -translate-y-1/2",
  bottom: "bottom-4 left-4 right-4",
};
