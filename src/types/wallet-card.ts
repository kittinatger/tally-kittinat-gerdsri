import type { CardNetwork } from "@/lib/wallet-cards";

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
  notes: string | null;
};
