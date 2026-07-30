"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, monthShortLabel, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import { useCurrency } from "@/lib/currency-context";

type Range = "month" | "all";

export default function CategoryOverview({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: CategoryOption[];
}) {
  const currency = useCurrency();
  const [type, setType] = useState<TransactionType>("expense");
  const [range, setRange] = useState<Range>("month");

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type).sort((a, b) => a.id - b.id),
    [categories, type],
  );

  function colorFor(name: string): string | undefined {
    return categoriesForType.find((c) => c.name === name)?.color;
  }

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

  const trend = useMemo(() => {
    const now = new Date(`${todayInputValue()}T00:00:00`);
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const totals = new Map(months.map((m) => [m, 0]));
    for (const e of expenses) {
      if (e.type !== type) continue;
      const key = monthKey(e.date);
      if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
    }
    const max = Math.max(...totals.values(), 0);
    return months.map((key) => ({ key, amount: totals.get(key) ?? 0, pct: max > 0 ? (totals.get(key)! / max) * 100 : 0 }));
  }, [expenses, type]);

  return (
    <div>
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
          {formatCurrency(breakdown.total, currency)}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {breakdown.count} transaction{breakdown.count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-6 rounded-card border border-line bg-surface p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {type === "income" ? "Income" : "Spending"} trend
        </p>
        <div className="flex items-end justify-between gap-2">
          {trend.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-foreground">
                {m.amount > 0 ? formatCurrency(m.amount, currency) : ""}
              </span>
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    type === "income" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-navy"
                  }`}
                  style={{ height: `${Math.max(m.pct, m.amount > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-ink-soft">{monthShortLabel(m.key)}</span>
            </div>
          ))}
        </div>
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
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(colorFor(row.category))}`}>
                  {row.category}
                </span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(row.amount, currency)}</span>
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
    </div>
  );
}
