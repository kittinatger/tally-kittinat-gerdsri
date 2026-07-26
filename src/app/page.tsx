import { listExpenses } from "@/lib/db";
import Dashboard from "@/components/Dashboard";
import type { Expense } from "@/types/expense";

// Always render fresh: the expense list changes on every write, and this
// also avoids the build needing a reachable database at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await listExpenses();
  const expenses: Expense[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: Number(r.amount),
    merchant: r.merchant,
    category: r.category,
    notes: r.notes,
  }));

  return <Dashboard initialExpenses={expenses} />;
}
