import type { CardNetwork } from "@/lib/wallet-cards";
import type { CardBackground } from "@/lib/card-backgrounds";
import type { ChipColor } from "@/lib/chip-colors";

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
  /** Manual text-color override — null means auto-contrast against the background. */
  textColor: string | null;
  /** Whether the EMV contact-chip visual shows on the card. */
  showChip: boolean;
  /** Which metal finish the chip renders in — see chip-colors.ts. */
  chipColor: ChipColor;
  notes: string | null;
};
