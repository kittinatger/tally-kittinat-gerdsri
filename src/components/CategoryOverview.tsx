"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, monthShortLabel, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import { useCurrency } from "@/lib/currency-context";
import FilterDropdown from "./FilterDropdown";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "./SpendingTrendChart";

type Range = "today" | "month" | "2months" | "3months" | "6months" | "year" | "all";

const RANGE_ORDER: Range[] = ["today", "month", "2months", "3months", "6months", "year"];
const RANGE_LABELS: Record<Range, string> = {
  today: "Today",
  month: "This month",
  "2months": "2 months",
  "3months": "3 months",
  "6months": "6 months",
  year: "Year",
  all: "All time",
};
const LABEL_TO_RANGE = Object.fromEntries(RANGE_ORDER.map((r) => [RANGE_LABELS[r], r])) as Record<string, Range>;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [chartType, setChartType] = useState<ChartType>("bar");

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type).sort((a, b) => a.id - b.id),
    [categories, type],
  );

  function colorFor(name: string): string | undefined {
    return categoriesForType.find((c) => c.name === name)?.color;
  }

  const breakdown = useMemo(() => {
    const today = todayInputValue();
    const now = new Date(`${today}T00:00:00`);

    let cutoff: string | null = null; // inclusive lower bound on date; null = no bound (all time)
    if (range === "month") {
      cutoff = dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (range === "2months" || range === "3months" || range === "6months") {
      const n = range === "2months" ? 2 : range === "3months" ? 3 : 6;
      cutoff = dateKey(new Date(now.getFullYear(), now.getMonth() - (n - 1), 1));
    } else if (range === "year") {
      cutoff = dateKey(new Date(now.getFullYear(), 0, 1));
    }

    const filtered = expenses.filter((e) => {
      if (e.type !== type) return false;
      if (range === "today") return e.date === today;
      if (cutoff && e.date < cutoff) return false;
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

  const trendMonths = useMemo(() => {
    const now = new Date(`${todayInputValue()}T00:00:00`);
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  }, []);

  const trend = useMemo(() => {
    const totals = new Map(trendMonths.map((m) => [m, 0]));
    for (const e of expenses) {
      if (e.type !== type) continue;
      const key = monthKey(e.date);
      if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
    }
    return trendMonths.map((key) => ({ key, label: monthShortLabel(key), amount: totals.get(key) ?? 0 }));
  }, [expenses, type, trendMonths]);

  const stackedTrend = useMemo(() => {
    const perMonth = new Map<string, Map<string, number>>(trendMonths.map((m) => [m, new Map()]));
    for (const e of expenses) {
      if (e.type !== type) continue;
      const bucket = perMonth.get(monthKey(e.date));
      if (!bucket) continue;
      bucket.set(e.category, (bucket.get(e.category) ?? 0) + e.amount);
    }
    return trendMonths.map((key) => {
      const bucket = perMonth.get(key)!;
      const segments = Array.from(bucket.entries())
        .map(([name, amount]) => ({
          name,
          amount,
          color: categoriesForType.find((c) => c.name === name)?.color,
        }))
        .sort((a, b) => b.amount - a.amount);
      return { key, label: monthShortLabel(key), segments };
    });
  }, [expenses, type, trendMonths, categoriesForType]);

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
          <FilterDropdown
            value={range === "all" ? "all" : RANGE_LABELS[range]}
            allLabel={RANGE_LABELS.all}
            options={RANGE_ORDER.map((r) => RANGE_LABELS[r])}
            onChange={(next) => setRange(next === "all" ? "all" : LABEL_TO_RANGE[next])}
          />
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {type === "income" ? "Income" : "Spending"} trend
          </p>
          <ChartTypeDropdown value={chartType} onChange={setChartType} />
        </div>
        <SpendingTrendChart
          chartType={chartType}
          points={trend}
          stackedPoints={stackedTrend}
          currency={currency}
          seriesTextClass={type === "income" ? "text-emerald-500 dark:text-emerald-400" : "text-navy"}
          seriesBgClass={type === "income" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-navy"}
        />
      </div>

      {breakdown.rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <svg viewBox="0 0 21.3281 31.6113" fill="currentColor" className="h-10 w-10 text-ink-soft">
            <path d="M4.16992 3.49609L4.16992 4.92188C4.16992 6.37695 5.16602 7.42188 6.62109 7.42188L14.3457 7.42188C15.8008 7.42188 16.7969 6.37695 16.7969 4.92188L16.7969 3.49609C16.7969 3.44727 16.7969 3.37891 16.7969 3.33008L17.3047 3.33008C19.707 3.33008 20.9668 4.60938 20.9668 7.13867L20.9668 26.4551C20.9668 28.9844 19.707 30.2539 17.207 30.2539L3.75977 30.2539C1.25977 30.2539 0 28.9844 0 26.4551L0 7.13867C0 4.60938 1.25977 3.33008 3.66211 3.33008L4.16992 3.33008C4.16992 3.37891 4.16992 3.44727 4.16992 3.49609ZM4.6875 24.2285C4.28711 24.2285 3.97461 24.541 3.97461 24.9219C3.97461 25.3125 4.29688 25.6348 4.6875 25.6348L11.3086 25.6348C11.6992 25.6348 12.0215 25.3125 12.0215 24.9219C12.0215 24.541 11.709 24.2285 11.3086 24.2285ZM4.6875 19.3457C4.28711 19.3457 3.97461 19.6582 3.97461 20.0391C3.97461 20.4395 4.28711 20.752 4.6875 20.752L16.2793 20.752C16.6797 20.752 16.9922 20.4395 16.9922 20.0391C16.9922 19.6582 16.6797 19.3457 16.2793 19.3457ZM14.7363 11.6406L11.0254 14.4531C10.8496 14.3359 10.6348 14.2773 10.4102 14.2773C10.1074 14.2773 9.84375 14.3848 9.63867 14.5703L6.24023 12.8516C6.21094 12.1387 5.66406 11.6895 5.05859 11.6895C4.4043 11.6895 3.87695 12.2168 3.87695 12.8809C3.87695 13.5352 4.4043 14.0625 5.05859 14.0625C5.32227 14.0625 5.56641 13.9746 5.76172 13.8281L9.23828 15.5957C9.29688 16.1816 9.78516 16.6504 10.4102 16.6504C10.9961 16.6504 11.6016 16.2305 11.5918 15.4004L15.332 12.5684C15.498 12.6562 15.6934 12.7148 15.8984 12.7148C16.5625 12.7148 17.0898 12.1777 17.0898 11.5332C17.0898 10.8691 16.5625 10.3418 15.8984 10.3418C15.2734 10.3418 14.6777 10.8301 14.7363 11.6406ZM13.0859 2.48047L14.3457 2.48047C15.0293 2.48047 15.4492 2.90039 15.4492 3.61328L15.4492 4.92188C15.4492 5.63477 15.0293 6.05469 14.3457 6.05469L6.62109 6.05469C5.9375 6.05469 5.51758 5.63477 5.51758 4.92188L5.51758 3.61328C5.51758 2.90039 5.9375 2.48047 6.62109 2.48047L7.88086 2.48047C7.94922 1.11328 9.0918 0 10.4883 0C11.875 0 13.0176 1.11328 13.0859 2.48047ZM9.36523 2.55859C9.36523 3.1543 9.86328 3.67188 10.4883 3.67188C11.1035 3.67188 11.6016 3.1543 11.6016 2.55859C11.6016 1.93359 11.1035 1.43555 10.4883 1.43555C9.86328 1.43555 9.36523 1.93359 9.36523 2.55859Z" />
          </svg>
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
