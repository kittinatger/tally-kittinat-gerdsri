import type { MessageKey } from "@/lib/i18n/messages";

// Where the EMV chip (see EMVChip in WalletCardShape.tsx) sits on the card
// face — a full 3x3 grid now (vertical: top/middle/bottom, horizontal:
// left/center/right), not just three left-anchored spots. A real card's
// chip only ever sits at the left, but this is a decorative preview, not
// a manufacturing spec, and letting it move horizontally (paired with
// EMVChip's own recolor options) is what makes a premade-card template's
// "chip on the right, matching this issuer's actual card" possible.
// "middleLeft" is still the default, unchanged from before this grid
// existed.
export const CHIP_POSITIONS = [
  "topLeft",
  "topCenter",
  "topRight",
  "middleLeft",
  "middleCenter",
  "middleRight",
  "bottomLeft",
  "bottomCenter",
  "bottomRight",
] as const;

export type ChipPosition = (typeof CHIP_POSITIONS)[number];

export function isChipPosition(value: string): value is ChipPosition {
  return (CHIP_POSITIONS as readonly string[]).includes(value);
}

export const DEFAULT_CHIP_POSITION: ChipPosition = "middleLeft";

// A position's row ("top"/"middle"/"bottom") — middle is the one row that
// never reserves space in the top/bottom text rows (it's vertically
// centered, not pulled into either), same reasoning WalletCardShape
// already applied when "middleLeft" was the only middle value.
export function chipRow(position: ChipPosition): "top" | "middle" | "bottom" {
  if (position.startsWith("top")) return "top";
  if (position.startsWith("bottom")) return "bottom";
  return "middle";
}

// A position's column — only "Left"/"Right" correspond to an actual
// screen corner (and so can coincide with the badge/NFC corner and need
// the same stacking treatment); "Center" never does.
export function chipColumn(position: ChipPosition): "left" | "center" | "right" {
  if (position.endsWith("Left")) return "left";
  if (position.endsWith("Right")) return "right";
  return "center";
}

export const CHIP_POSITION_LABEL_KEYS: Record<ChipPosition, MessageKey> = {
  topLeft: "wallet.chipPositionTopLeft",
  topCenter: "wallet.chipPositionTopCenter",
  topRight: "wallet.chipPositionTopRight",
  middleLeft: "wallet.chipPositionMiddleLeft",
  middleCenter: "wallet.chipPositionMiddleCenter",
  middleRight: "wallet.chipPositionMiddleRight",
  bottomLeft: "wallet.chipPositionBottomLeft",
  bottomCenter: "wallet.chipPositionBottomCenter",
  bottomRight: "wallet.chipPositionBottomRight",
};

// Tailwind classes anchoring the chip to its spot in the 3x3 grid — top/
// bottom rows sit at the same p-4/inset-4 edge every other corner element
// uses; the middle row centers vertically against the card's left/right
// edge (or dead center for middleCenter), matching how "middleLeft" always
// centered vertically rather than merely avoiding the top/bottom corners.
export const CHIP_POSITION_CLASSES: Record<ChipPosition, string> = {
  topLeft: "top-4 left-4",
  topCenter: "top-4 left-1/2 -translate-x-1/2",
  topRight: "top-4 right-4",
  middleLeft: "top-1/2 left-4 -translate-y-1/2",
  middleCenter: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  middleRight: "top-1/2 right-4 -translate-y-1/2",
  bottomLeft: "bottom-4 left-4",
  bottomCenter: "bottom-4 left-1/2 -translate-x-1/2",
  bottomRight: "bottom-4 right-4",
};
