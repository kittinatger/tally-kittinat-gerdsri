"use client";

import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";

export default function ExpenseRow({
  expense,
  onClick,
  isLast,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  expense: Expense;
  onClick: () => void;
  isLast: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();

  return (
    <button
      onClick={selectMode ? onToggleSelect : onClick}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-nav-hover)] ${
        isLast ? "" : "border-b border-surface-line"
      } ${selected ? "bg-[var(--surface-nav-hover)]" : ""}`}
    >
      {selectMode && (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-surface-accent bg-surface-accent text-white" : "border-surface-line"
          }`}
        >
          {selected && (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M4 10l4 4 8-8" />
            </svg>
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-surface-foreground">{expense.merchant}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(color)}`}>
            {icon ? `${icon} ` : ""}
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
          expense.type === "income"
            ? "text-emerald-600 dark:text-emerald-400"
            : expense.type === "transfer"
              ? "text-surface-foreground-soft"
              : "text-red-600 dark:text-red-400"
        }`}
      >
        {signedAmount(expense) >= 0 ? "+" : "-"}
        {formatCurrency(expense.amount, currency)}
      </p>
    </button>
  );
}
