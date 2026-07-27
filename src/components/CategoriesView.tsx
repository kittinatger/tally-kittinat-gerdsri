"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { categoryStyle } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import AppHeader from "./AppHeader";

type Range = "month" | "all";

export default function CategoriesView({ expenses }: { expenses: Expense[] }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [range, setRange] = useState<Range>("month");

  const breakdown = useMemo(() => {
    const currentMonthKey = monthKey(todayInputValue());
    const filtered = expenses.filter((e) => {
      if (e.type !== type) return false;
      if (range === "month" && monthKey(e.date) !== currentMonthKey) return false;
      return true;
    });

    const totals = new Map<string, number>();
    for (const e of filtered) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }

    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    const rows = Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { rows, total, count: filtered.length };
  }, [expenses, type, range]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-foreground">Categories</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              <button
                onClick={() => setType("expense")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  type === "expense" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setType("income")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  type === "income" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                Income
              </button>
            </div>
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              <button
                onClick={() => setRange("month")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  range === "month" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                This month
              </button>
              <button
                onClick={() => setRange("all")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  range === "all" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                All time
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Total {type === "income" ? "income" : "spent"}
          </p>
          <p
            className={`mt-1.5 font-display text-3xl ${
              type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            }`}
          >
            {formatCurrency(breakdown.total)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {breakdown.count} transaction{breakdown.count === 1 ? "" : "s"}
          </p>
        </div>

        {breakdown.rows.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-4xl">📊</p>
            <p className="font-display text-lg text-foreground">No data yet</p>
            <p className="text-sm text-ink-soft">
              {type === "income" ? "Income" : "Expenses"} for this range will show up here once you&apos;ve logged
              some.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {breakdown.rows.map((row) => (
              <div key={row.category} className="rounded-card border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(row.category)}`}>
                    {row.category}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(row.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className="h-full rounded-full bg-navy transition-all"
                    style={{ width: `${Math.max(row.pct, 2)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">{row.pct.toFixed(1)}% of total</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
