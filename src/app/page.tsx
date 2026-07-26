import { listExpenses, getRemaining } from "@/lib/db";
import Dashboard from "@/components/Dashboard";
import type { Expense } from "@/types/expense";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rows, remaining] = await Promise.all([listExpenses(), getRemaining()]);
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
  }));

  return <Dashboard initialExpenses={expenses} initialRemaining={remaining} />;
}
