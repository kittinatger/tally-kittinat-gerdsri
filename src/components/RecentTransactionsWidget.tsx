"use client";

import Link from "next/link";
import type { Expense } from "@/types/expense";
import { signedAmount } from "@/types/expense";
import { useCategoryColor } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import WidgetCard from "./WidgetCard";

function Row({ expense, isLast }: { expense: Expense; isLast: boolean }) {
  const color = useCategoryColor(expense.type, expense.category);
  const currency = useCurrency();

  return (
    <div className={`flex items-center gap-3 py-2.5 ${isLast ? "" : "border-b border-surface-line"}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dotClasses(color)}`}>
        <span className="h-2 w-2 rounded-full bg-white/80" />
      </span>
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
    <WidgetCard color="slate">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
          Recent transactions
        </p>
        <Link href="/" className="text-xs font-semibold text-surface-accent hover:underline">
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
    </WidgetCard>
  );
}
