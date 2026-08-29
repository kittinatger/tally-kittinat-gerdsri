import type { CardNetwork } from "@/lib/wallet-cards";
import type { CardBackground } from "@/lib/card-backgrounds";
import type { ChipColor } from "@/lib/chip-colors";
import type { BadgePosition } from "@/lib/badge-position";
import type { ChipPosition } from "@/lib/chip-position";

export type WalletCard = {
  id: number;
  label: string;
  holderName: string | null;
  /** Last 4 digits only — see the wallet_cards table comment in db.ts. */
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  network: CardNetwork;
  color: string;
  /** Optional pattern/gradient background — null means "plain `color` gradient". */
  background: CardBackground | null;
  /** Whether the generic (non-trademark) network badge shows on the card visual. */
  showNetworkBadge: boolean;
  /** Which corner the network badge sits in — see badge-position.ts. */
  badgePosition: BadgePosition;
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor: string | null;
  /** Manual network-badge/icon color override — null means it follows
   * textColor's auto-contrast color. Only visible on visa/discover (mask-
   * recolored) and the generic monogram badge; other networks render a
   * fixed-color brand logo that isn't tintable. */
  iconColor: string | null;
  /** Whether the EMV contact-chip visual shows on the card. */
  showChip: boolean;
  /** Which metal finish the chip renders in — see chip-colors.ts. */
  chipColor: ChipColor;
  /** Where the chip sits — see chip-position.ts. */
  chipPosition: ChipPosition;
  notes: string | null;
};
