import type { MessageKey } from "@/lib/i18n/messages";

// Where the masked card-number row (see WalletCardShape.tsx) sits on the
// card face — full-width, unlike the chip's single left-anchored spot,
// since it's a line of text rather than a small icon. "top" is the
// default and matches where it always rendered (the row right under the
// name), so existing cards look unchanged until someone picks otherwise.
export const CARD_NUMBER_POSITIONS = ["top", "middle", "bottom"] as const;

export type CardNumberPosition = (typeof CARD_NUMBER_POSITIONS)[number];

export function isCardNumberPosition(value: string): value is CardNumberPosition {
  return (CARD_NUMBER_POSITIONS as readonly string[]).includes(value);
}

export const DEFAULT_CARD_NUMBER_POSITION: CardNumberPosition = "top";

export const CARD_NUMBER_POSITION_LABEL_KEYS: Record<CardNumberPosition, MessageKey> = {
  top: "wallet.chipPositionTop",
  middle: "wallet.chipPositionMiddle",
  bottom: "wallet.chipPositionBottom",
};

// Only "middle"/"bottom" need anchor classes — "top" stays in its
// original inline row (see the nameInCorner precedent in
// WalletCardShape.tsx) rather than becoming a free-floating element, so
// the default case doesn't change how any existing card lays out.
export const CARD_NUMBER_POSITION_CLASSES: Record<"middle" | "bottom", string> = {
  middle: "top-1/2 left-4 right-4 -translate-y-1/2",
  bottom: "bottom-4 left-4 right-4",
};
