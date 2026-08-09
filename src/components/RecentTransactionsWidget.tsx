"use client";

import Link from "next/link";
import type { Expense } from "@/types/expense";
import { signedAmount } from "@/types/expense";
import { useCategoryColor } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";

function Row({ expense, isLast }: { expense: Expense; isLast: boolean }) {
  const color = useCategoryColor(expense.type, expense.category);
  const currency = useCurrency();

  return (
    <div className="relative flex gap-3 pb-4 pl-1 last:pb-0">
      {!isLast && <span className="absolute bottom-0 left-[7px] top-4 w-px bg-surface-line" />}
      <span className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface ${dotClasses(color)}`} />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-surface-foreground">{expense.merchant}</p>
          <p className="truncate text-[11px] text-surface-foreground-soft">
            {expense.category} · {formatDateShort(expense.date)}
          </p>
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
    </div>
  );
}

export default function RecentTransactionsWidget({ expenses, limit = 5 }: { expenses: Expense[]; limit?: number }) {
  const recent = expenses.slice(0, limit);

  return (
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <div className="mb-3 flex items-center justify-between">
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
        <div>
          {recent.map((e, i) => (
            <Row key={e.id} expense={e} isLast={i === recent.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
