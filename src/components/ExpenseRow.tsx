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
      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60 ${
        isLast ? "" : "border-b border-neutral-100 dark:border-neutral-800"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{expense.merchant}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyle(expense.category)}`}>
            {expense.category}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatDateLong(expense.date)}</span>
        </div>
      </div>
      <p className="shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(expense.amount)}</p>
    </button>
  );
}
