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
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">This month</p>
        <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {formatCurrency(total)}
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Transactions</p>
        <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {thisMonth.length}
        </p>
      </div>
      <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:col-span-1">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Top category</p>
        {topCategory ? (
          <span className={`mt-1.5 inline-block rounded-full px-2 py-1 text-xs font-medium ${categoryStyle(topCategory)}`}>
            {topCategory}
          </span>
        ) : (
          <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">—</p>
        )}
      </div>
    </div>
  );
}
