import type { MessageKey } from "@/lib/i18n/messages";

// The EMV contact-chip visual on WalletCardShape (see EMVChip there) can be
// toggled off or recolored — real cards ship the chip in gold, silver,
// "rose gold", graphite/black, or copper finishes, so those five are what's
// offered here. The contact-pad line pattern itself (the little house-shape
// notches cut into the metal) is the generic, industry-standard EMV chip
// look shared across every issuer/card — not any specific brand's design.
export const CHIP_COLORS = ["gold", "silver", "roseGold", "graphite", "copper"] as const;

export type ChipColor = (typeof CHIP_COLORS)[number];

export function isChipColor(value: string): value is ChipColor {
  return (CHIP_COLORS as readonly string[]).includes(value);
}

export const DEFAULT_CHIP_COLOR: ChipColor = "gold";

export const CHIP_COLOR_LABEL_KEYS: Record<ChipColor, MessageKey> = {
  gold: "wallet.chipColorGold",
  silver: "wallet.chipColorSilver",
  roseGold: "wallet.chipColorRoseGold",
  graphite: "wallet.chipColorGraphite",
  copper: "wallet.chipColorCopper",
};

// Light/base/dark stops for a diagonal brushed-metal gradient per finish —
// same three-tone approach real chip photography shows (a highlight streak,
// the base tone, a shadow edge).
export const CHIP_COLOR_STOPS: Record<ChipColor, { light: string; base: string; dark: string }> = {
  gold: { light: "#f5e2a8", base: "#d4af6a", dark: "#a87f34" },
  silver: { light: "#f1f5f9", base: "#c3cad3", dark: "#8b95a1" },
  roseGold: { light: "#f6d9cf", base: "#e0ab97", dark: "#b17862" },
  graphite: { light: "#6b7280", base: "#3f4451", dark: "#1f2329" },
  copper: { light: "#e8b48a", base: "#c1774a", dark: "#8a4d28" },
};
