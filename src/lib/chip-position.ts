import type { MessageKey } from "@/lib/i18n/messages";

// Where the EMV chip (see EMVChip in WalletCardShape.tsx) sits on the card
// face — always left-aligned, same as a real card's embedded chip, with
// three vertical spots. "middleLeft" is the default and now genuinely
// centers the chip vertically against the card's left edge (it used to
// just render inline next to the card-number row instead, which reads as
// "near the top" — not what a "Middle" label promises).
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

// Tailwind classes anchoring the chip to its spot — top/bottom use the
// same p-4/inset-4 convention as BADGE_POSITION_CLASSES; middleLeft
// centers it vertically against the card's left edge (its label reads
// "Middle", so it should actually sit in the visual middle of the card
// face, not merely avoid the top/bottom corners while still landing near
// the top next to the card-number row).
export const CHIP_POSITION_CLASSES: Record<ChipPosition, string> = {
  topLeft: "top-4 left-4",
  middleLeft: "top-1/2 left-4 -translate-y-1/2",
  bottomLeft: "bottom-4 left-4",
};
