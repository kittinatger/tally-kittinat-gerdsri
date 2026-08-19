import type { WalletKind } from "@/lib/wallets";
import type { CardBackground } from "@/lib/card-backgrounds";

export type WalletOption = {
  id: number;
  name: string;
  color: string;
  /** Optional pattern/gradient background — null means "plain `color` gradient". */
  background: CardBackground | null;
  kind: WalletKind;
  /** Null means "use the app's default currency" — a display label only, amounts aren't converted. */
  currency: string | null;
  isDefault: boolean;
  archived: boolean;
  balance: number;
};
