import { isTransactionType, isTransferDirection, type TransactionType, type TransferDirection } from "@/lib/categories";

/** Coerces an API/DB row's raw type & direction strings into typed values, defaulting to "expense" for anything unrecognized. */
export function normalizeExpenseType(rawType: string): TransactionType {
  return isTransactionType(rawType) ? rawType : "expense";
}

export function normalizeDirection(rawDirection: string | null | undefined): TransferDirection | null {
  return typeof rawDirection === "string" && isTransferDirection(rawDirection) ? rawDirection : null;
}

export type Expense = {
  id: number;
  type: TransactionType;
  /** Only meaningful when type is "transfer". */
  direction: TransferDirection | null;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
  hasReceipt: boolean;
};

export function signedAmount(expense: Expense): number {
  if (expense.type === "transfer") {
    return expense.direction === "in" ? expense.amount : -expense.amount;
  }
  return expense.type === "income" ? expense.amount : -expense.amount;
}
