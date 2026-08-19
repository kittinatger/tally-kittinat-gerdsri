import type { CardNetwork } from "@/lib/wallet-cards";
import type { CardBackground } from "@/lib/card-backgrounds";

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
  notes: string | null;
};
