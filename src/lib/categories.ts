export const TRANSACTION_TYPES = ["expense", "income"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

// Categories themselves are now user-editable and stored in the database
// (see lib/db.ts categories table) — this palette is just the fixed set of
// colors a category can be assigned, and only used to seed the defaults.
export const CATEGORY_PALETTE = [
  "emerald",
  "green",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "pink",
  "rose",
  "orange",
  "amber",
  "lime",
  "slate",
] as const;
export type CategoryColor = (typeof CATEGORY_PALETTE)[number];
