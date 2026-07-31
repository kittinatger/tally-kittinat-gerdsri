import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";

export default function SummaryCards({
  expenses,
  remaining,
  onEditBalance,
}: {
  expenses: Expense[];
  remaining: number;
  onEditBalance: () => void;
}) {
  const currency = useCurrency();
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);

  const monthIncome = thisMonth.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const monthSpent = thisMonth.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <div className="rounded-card border border-surface-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Income</p>
        <p className="mt-1.5 font-display text-xl text-emerald-600 dark:text-emerald-400 sm:text-2xl">
          {formatCurrency(monthIncome, currency)}
        </p>
      </div>
      <div className="rounded-card border border-surface-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Expenses</p>
        <p className="mt-1.5 font-display text-xl text-red-600 dark:text-red-400 sm:text-2xl">
          {formatCurrency(monthSpent, currency)}
        </p>
      </div>
      <button
        onClick={onEditBalance}
        className="rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Remaining</p>
          <svg
            viewBox="0 0 20.3949 19.9823"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft"
          >
            <path d="M3.24919 18.8046L17.3312 4.74211L15.3293 2.73039L1.24723 16.7929L0.0265306 19.4882C-0.0906569 19.7616 0.202312 20.0741 0.475749 19.957ZM18.3761 3.72649L19.5578 2.55461C20.1632 1.94914 20.1925 1.31438 19.6554 0.777268L19.3039 0.425706C18.7765-0.101638 18.132-0.0528096 17.5363 0.533128L16.3449 1.705Z" />
          </svg>
        </div>
        <p
          className={`mt-1.5 font-display text-xl sm:text-2xl ${
            remaining >= 0 ? "text-surface-accent" : "text-red-600 dark:text-red-400"
          }`}
        >
          {remaining < 0 ? "-" : ""}
          {formatCurrency(Math.abs(remaining), currency)}
        </p>
      </button>
    </div>
  );
}
