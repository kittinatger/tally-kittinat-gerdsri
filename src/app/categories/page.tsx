import { listExpenses } from "@/lib/db";
import CategoriesView from "@/components/CategoriesView";
import type { Expense } from "@/types/expense";

// Always render fresh, same reasoning as the home page.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const rows = await listExpenses();
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
  }));

  return <CategoriesView expenses={expenses} />;
}
