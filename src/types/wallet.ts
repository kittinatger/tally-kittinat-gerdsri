import type { WalletKind } from "@/lib/wallets";

export type WalletOption = {
  id: number;
  name: string;
  color: string;
  kind: WalletKind;
  /** Null means "use the app's default currency" — a display label only, amounts aren't converted. */
  currency: string | null;
  isDefault: boolean;
  archived: boolean;
  balance: number;
};
