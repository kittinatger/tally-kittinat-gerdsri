"use client";

import Link from "next/link";
import type { Expense } from "@/types/expense";
import { signedAmount } from "@/types/expense";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, formatDateShort } from "@/lib/format";

function Row({ expense }: { expense: Expense }) {
  const color = useCategoryColor(expense.type, expense.category);
  const currency = useCurrency();

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-surface-foreground">{expense.merchant}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badgeClasses(color)}`}>
            {expense.category}
          </span>
          <span className="text-[11px] text-surface-foreground-soft">{formatDateShort(expense.date)}</span>
        </div>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
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
    </div>
  );
}

export default function RecentTransactionsWidget({ expenses }: { expenses: Expense[] }) {
  const recent = expenses.slice(0, 5);

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
          Recent transactions
        </p>
        <Link href="/activities" className="text-xs font-semibold text-surface-accent hover:underline">
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="py-3 text-sm text-surface-foreground-soft">No transactions yet.</p>
      ) : (
        <div className="divide-y divide-surface-line">
          {recent.map((e) => (
            <Row key={e.id} expense={e} />
          ))}
        </div>
      )}
    </div>
  );
}
