"use client";

import type { Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor } from "@/lib/categories-context";

export default function ExpenseRow({
  expense,
  onClick,
  isLast,
}: {
  expense: Expense;
  onClick: () => void;
  isLast: boolean;
}) {
  const color = useCategoryColor(expense.type, expense.category);

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
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(color)}`}>
            {expense.category}
          </span>
          <span className="text-xs text-surface-foreground-soft">{formatDateLong(expense.date)}</span>
        </div>
        {expense.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {expense.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--surface-nav-hover)] px-2 py-0.5 text-[11px] font-medium text-surface-foreground-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <p
        className={`shrink-0 font-semibold ${
          expense.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {expense.type === "income" ? "+" : "-"}
        {formatCurrency(expense.amount)}
      </p>
    </button>
  );
}
