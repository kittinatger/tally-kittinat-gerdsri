import type { MessageKey } from "@/lib/i18n/messages";

// Where the EMV chip (see EMVChip in WalletCardShape.tsx) sits on the card
// face — always left-aligned, same as a real card's embedded chip, with
// three vertical spots. "middleLeft" is the original placement (inline
// next to the card number, unchanged since it was added) and stays the
// default so existing cards look the same until someone picks otherwise.
export const CHIP_POSITIONS = ["topLeft", "middleLeft", "bottomLeft"] as const;

export type ChipPosition = (typeof CHIP_POSITIONS)[number];

export function isChipPosition(value: string): value is ChipPosition {
  return (CHIP_POSITIONS as readonly string[]).includes(value);
}

export const DEFAULT_CHIP_POSITION: ChipPosition = "middleLeft";

export const CHIP_POSITION_LABEL_KEYS: Record<ChipPosition, MessageKey> = {
  topLeft: "wallet.chipPositionTop",
  middleLeft: "wallet.chipPositionMiddle",
  bottomLeft: "wallet.chipPositionBottom",
};

// Tailwind classes anchoring the chip to the top/bottom corner when it's
// pulled out of the middle number row — same p-4/inset-4 convention as
// BADGE_POSITION_CLASSES.
export const CHIP_POSITION_CLASSES: Record<"topLeft" | "bottomLeft", string> = {
  topLeft: "top-4 left-4",
  bottomLeft: "bottom-4 left-4",
};
