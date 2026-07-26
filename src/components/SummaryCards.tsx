import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { categoryStyle } from "@/lib/category-styles";

export default function SummaryCards({ expenses }: { expenses: Expense[] }) {
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);
  const total = thisMonth.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const e of thisMonth) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  let topCategory: string | null = null;
  let topAmount = 0;
  for (const [cat, amt] of byCategory) {
    if (amt > topAmount) {
      topCategory = cat;
      topAmount = amt;
    }
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">This month</p>
        <p className="mt-1.5 font-display text-2xl text-navy sm:text-3xl">{formatCurrency(total)}</p>
      </div>
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Transactions</p>
        <p className="mt-1.5 font-display text-2xl text-navy sm:text-3xl">{thisMonth.length}</p>
      </div>
      <div className="col-span-2 rounded-card border border-line bg-surface p-4 sm:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Top category</p>
        {topCategory ? (
          <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(topCategory)}`}>
            {topCategory}
          </span>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">—</p>
        )}
      </div>
    </div>
  );
}
