import type { MessageKey } from "@/lib/i18n/messages";

// How big the contactless/NFC symbol renders on the card face — see
// NfcIcon in WalletCardShape.tsx. Two sizes only (not a free slider):
// "small" (default) is the original size this feature shipped with, the
// same fixed height a recolorable network badge (Visa, Discover, JCB,
// Apple Pay — see RECOLORABLE_BADGE_ASPECT) renders at; "big" matches the
// taller fixed height every other network's own real-artwork badge image
// renders at (mastercard/amex/unionpay/the generic "other" mark), for an
// issuer whose real card carries a more prominent contactless mark.
export const NFC_SIZES = ["small", "big"] as const;

export type NfcSize = (typeof NFC_SIZES)[number];

export function isNfcSize(value: string): value is NfcSize {
  return (NFC_SIZES as readonly string[]).includes(value);
}

export const DEFAULT_NFC_SIZE: NfcSize = "small";

export const NFC_SIZE_LABEL_KEYS: Record<NfcSize, MessageKey> = {
  small: "wallet.nfcSizeSmall",
  big: "wallet.nfcSizeBig",
};

// Tailwind classes for NfcIcon's square footprint — h-6 matches the
// recolorable network badges' own fixed height exactly (see the mask-image
// div in WalletCardShape.tsx).
export const NFC_SIZE_CLASSES: Record<NfcSize, string> = {
  small: "h-5 w-5",
  big: "h-6 w-6",
};
