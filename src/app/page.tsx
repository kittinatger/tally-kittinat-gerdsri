import { listExpenses, getRemaining, listCategories, getCurrency } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getUserId();
  const [rows, remaining, categoryRows, currency] = await Promise.all([
    listExpenses(userId),
    getRemaining(userId),
    listCategories(userId),
    getCurrency(userId),
  ]);
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
    tags: r.tags ?? [],
    hasReceipt: r.has_receipt,
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: c.type === "income" ? "income" : "expense",
    name: c.name,
    color: c.color,
  }));

  return (
    <Dashboard initialExpenses={expenses} initialRemaining={remaining} categories={categories} currency={currency} />
  );
}
