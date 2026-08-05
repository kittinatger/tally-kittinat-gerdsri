"use client";

import type { Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";

export default function SplitExpenseGroup({
  items,
  onSelectLine,
  isLast,
}: {
  items: Expense[];
  onSelectLine: (expense: Expense) => void;
  isLast: boolean;
}) {
  const currency = useCurrency();
  const first = items[0];
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={`px-4 py-3.5 ${isLast ? "" : "border-b border-surface-line"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-surface-foreground">{first.merchant}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-[var(--surface-nav-hover)] px-2 py-0.5 text-xs font-semibold text-surface-foreground-soft">
              Split · {items.length} categories
            </span>
            <span className="text-xs text-surface-foreground-soft">{formatDateLong(first.date)}</span>
          </div>
        </div>
        <p
          className={`shrink-0 font-semibold ${
            first.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {first.type === "income" ? "+" : "-"}
          {formatCurrency(total, currency)}
        </p>
      </div>
      <div className="mt-2 space-y-0.5 border-l-2 border-surface-line pl-3">
        {items.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelectLine(e)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface-nav-hover)]"
          >
            <span className="truncate text-sm text-surface-foreground">{e.category}</span>
            <span className="shrink-0 text-sm text-surface-foreground-soft">{formatCurrency(e.amount, currency)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
