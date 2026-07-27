import type { Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { categoryStyle } from "@/lib/category-styles";

export default function ExpenseRow({
  expense,
  onClick,
  isLast,
}: {
  expense: Expense;
  onClick: () => void;
  isLast: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)] ${
        isLast ? "" : "border-b border-surface-line"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-surface-foreground">{expense.merchant}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyle(expense.category)}`}>
            {expense.category}
          </span>
          <span className="text-xs text-surface-foreground-soft">{formatDateLong(expense.date)}</span>
        </div>
      </div>
      <p
        className={`shrink-0 font-semibold ${expense.type === "income" ? "text-emerald-400" : "text-red-400"}`}
      >
        {expense.type === "income" ? "+" : "-"}
        {formatCurrency(expense.amount)}
      </p>
    </button>
  );
}
