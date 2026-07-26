export type Expense = {
  id: number;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string | null;
};
