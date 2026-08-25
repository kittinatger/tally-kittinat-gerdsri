import type { MessageKey } from "@/lib/i18n/messages";

// Where the network badge (see WalletCardShape.tsx) sits on the card face —
// the four corners, same as where a real card's network mark typically
// lands depending on the issuer.
export const BADGE_POSITIONS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;

export type BadgePosition = (typeof BADGE_POSITIONS)[number];

export function isBadgePosition(value: string): value is BadgePosition {
  return (BADGE_POSITIONS as readonly string[]).includes(value);
}

// Matches the badge's original always-top-right placement, so existing
// cards look unchanged until someone picks a different corner.
export const DEFAULT_BADGE_POSITION: BadgePosition = "topRight";

export const BADGE_POSITION_LABEL_KEYS: Record<BadgePosition, MessageKey> = {
  topLeft: "wallet.badgePositionTopLeft",
  topRight: "wallet.badgePositionTopRight",
  bottomLeft: "wallet.badgePositionBottomLeft",
  bottomRight: "wallet.badgePositionBottomRight",
};

// Tailwind classes anchoring the badge to each corner — the card container
// is `relative` with p-4, so top-4/right-4 etc. line up flush with the
// same inset every other corner element (chip, label, expiry) already uses.
export const BADGE_POSITION_CLASSES: Record<BadgePosition, string> = {
  topLeft: "top-4 left-4",
  topRight: "top-4 right-4",
  bottomLeft: "bottom-4 left-4",
  bottomRight: "bottom-4 right-4",
};
