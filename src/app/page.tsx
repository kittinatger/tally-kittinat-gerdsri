import { listExpenses, getRemaining, listCategories } from "@/lib/db";
import Dashboard from "@/components/Dashboard";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rows, remaining, categoryRows] = await Promise.all([listExpenses(), getRemaining(), listCategories()]);
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: c.type === "income" ? "income" : "expense",
    name: c.name,
    color: c.color,
  }));

  return <Dashboard initialExpenses={expenses} initialRemaining={remaining} categories={categories} />;
}
