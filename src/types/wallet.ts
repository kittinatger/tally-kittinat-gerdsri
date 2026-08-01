import type { WalletKind } from "@/lib/wallets";

export type WalletOption = {
  id: number;
  name: string;
  color: string;
  kind: WalletKind;
  balance: number;
};
