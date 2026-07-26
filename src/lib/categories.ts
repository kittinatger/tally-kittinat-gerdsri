export const TRANSACTION_TYPES = ["expense", "income"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Food & Drink",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Travel",
  "Other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Refund",
  "Other",
] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export type Category = ExpenseCategory | IncomeCategory;

export function categoriesForType(type: TransactionType): readonly string[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function isCategory(type: TransactionType, value: string): boolean {
  return categoriesForType(type).includes(value);
}
