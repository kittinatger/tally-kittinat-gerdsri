import type { TransactionType } from "@/lib/categories";

export type Expense = {
  id: number;
  type: TransactionType;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
};

export function signedAmount(expense: Expense): number {
  return expense.type === "income" ? expense.amount : -expense.amount;
}
