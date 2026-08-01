import { listExpenses, listCategories, getCurrency } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import ActivitiesView from "@/components/ActivitiesView";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";

// Always render fresh, same reasoning as the dashboard page.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const userId = await getUserId();
  const [rows, categoryRows, currency] = await Promise.all([
    listExpenses(userId),
    listCategories(userId),
    getCurrency(userId),
  ]);
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: normalizeExpenseType(r.type),
    direction: normalizeDirection(r.direction),
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
    type: isTransactionType(c.type) ? c.type : "expense",
    name: c.name,
    color: c.color,
  }));

  return <ActivitiesView initialExpenses={expenses} categories={categories} currency={currency} />;
}
