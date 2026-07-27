import { listExpenses, listCategories } from "@/lib/db";
import CategoriesView from "@/components/CategoriesView";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";

// Always render fresh, same reasoning as the home page.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [rows, categoryRows] = await Promise.all([listExpenses(), listCategories()]);
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
    tags: r.tags ?? [],
  }));
  const categories: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    type: c.type === "income" ? "income" : "expense",
    name: c.name,
    color: c.color,
  }));

  return <CategoriesView expenses={expenses} categories={categories} />;
}
