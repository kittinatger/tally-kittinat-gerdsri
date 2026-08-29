// Payment-card *visuals* only — see the comment on the wallet_cards table
// in db.ts for why full card numbers are never stored or requested here.
export const CARD_NETWORKS = ["visa", "mastercard", "amex", "discover", "jcb", "unionpay", "apple-pay", "other"] as const;
export type CardNetwork = (typeof CARD_NETWORKS)[number];

export function isCardNetwork(value: string): value is CardNetwork {
  return (CARD_NETWORKS as readonly string[]).includes(value);
}
