export const TRANSACTION_TYPES = ["expense", "income", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

// Only meaningful when type is "transfer" -- which direction money moved.
// "out" behaves like an expense for balance purposes (e.g. topping up an
// e-wallet), "in" behaves like income (e.g. withdrawing back). Transfers are
// never counted in Income/Expenses totals since money moving between your
// own accounts isn't spending or earning.
export const TRANSFER_DIRECTIONS = ["out", "in"] as const;
export type TransferDirection = (typeof TRANSFER_DIRECTIONS)[number];

export function isTransferDirection(value: string): value is TransferDirection {
  return (TRANSFER_DIRECTIONS as readonly string[]).includes(value);
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
