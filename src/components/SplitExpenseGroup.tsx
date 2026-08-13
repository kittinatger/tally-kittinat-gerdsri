"use client";

import type { Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { badgeClasses } from "@/lib/category-styles";

function SplitIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 6h5.5M4 6l2.5-2.5M4 6l2.5 2.5" />
      <path d="M16 14h-5.5M16 14l-2.5-2.5M16 14l-2.5 2.5" />
    </svg>
  );
}

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
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${badgeClasses("amber")}`}>
          <SplitIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-surface-foreground">{first.merchant}</p>
          <p className="mt-0.5 truncate text-xs text-surface-foreground-soft">
            Split · {items.length} categories · {formatDateLong(first.date)}
          </p>
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
      <div className="mt-2 space-y-0.5 border-l-2 border-amber-200 pl-3 dark:border-amber-900/50">
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
