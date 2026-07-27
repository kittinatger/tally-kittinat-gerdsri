import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";

export default function SummaryCards({
  expenses,
  remaining,
  onEditBalance,
}: {
  expenses: Expense[];
  remaining: number;
  onEditBalance: () => void;
}) {
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);

  const monthIncome = thisMonth.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const monthSpent = thisMonth.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <div className="rounded-card border border-surface-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Income</p>
        <p className="mt-1.5 font-display text-xl text-emerald-400 sm:text-2xl">{formatCurrency(monthIncome)}</p>
      </div>
      <div className="rounded-card border border-surface-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Expenses</p>
        <p className="mt-1.5 font-display text-xl text-red-400 sm:text-2xl">{formatCurrency(monthSpent)}</p>
      </div>
      <button
        onClick={onEditBalance}
        className="rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Remaining</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft"
          >
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
          </svg>
        </div>
        <p
          className={`mt-1.5 font-display text-xl sm:text-2xl ${remaining >= 0 ? "text-surface-accent" : "text-red-400"}`}
        >
          {remaining < 0 ? "-" : ""}
          {formatCurrency(Math.abs(remaining))}
        </p>
      </button>
    </div>
  );
}
