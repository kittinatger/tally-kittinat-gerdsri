export const WALLET_KINDS = ["cash", "digital"] as const;
export type WalletKind = (typeof WALLET_KINDS)[number];

export function isWalletKind(value: string): value is WalletKind {
  return (WALLET_KINDS as readonly string[]).includes(value);
}
