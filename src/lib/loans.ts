// A standalone "I lent/borrowed money" ledger with a manual payoff
// schedule — distinct from splits.ts (one-off shared-expense ledgers,
// always between existing Friends). A loan's counterparty can be a friend
// (counterpartyFriendId set) or just a name typed in (counterpartyName),
// since an IOU is often with someone not on Tally at all.
export const LOAN_DIRECTIONS = ["lent", "borrowed"] as const;
export type LoanDirection = (typeof LOAN_DIRECTIONS)[number];

export function isLoanDirection(value: string): value is LoanDirection {
  return (LOAN_DIRECTIONS as readonly string[]).includes(value);
}
