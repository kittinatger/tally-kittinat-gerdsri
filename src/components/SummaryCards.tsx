import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";

export default function SummaryCards({ expenses }: { expenses: Expense[] }) {
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);

  const income = thisMonth.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const spent = thisMonth.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const net = income - spent;

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Income</p>
        <p className="mt-1.5 font-display text-xl text-emerald-600 dark:text-emerald-400 sm:text-2xl">
          {formatCurrency(income)}
        </p>
      </div>
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Expenses</p>
        <p className="mt-1.5 font-display text-xl text-foreground sm:text-2xl">{formatCurrency(spent)}</p>
      </div>
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Net</p>
        <p
          className={`mt-1.5 font-display text-xl sm:text-2xl ${
            net >= 0 ? "text-navy" : "text-red-600 dark:text-red-400"
          }`}
        >
          {net >= 0 ? "+" : "-"}
          {formatCurrency(Math.abs(net))}
        </p>
      </div>
    </div>
  );
}
