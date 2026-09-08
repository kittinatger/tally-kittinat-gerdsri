"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, monthShortLabel, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { CATEGORY_PALETTE, type TransactionType, type CategoryColor } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import { useCurrency } from "@/lib/currency-context";
import FilterDropdown from "./FilterDropdown";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "./SpendingTrendChart";
import WidgetCard from "./WidgetCard";

const TYPE_COLOR: Record<TransactionType, CategoryColor> = { expense: "rose", income: "emerald", transfer: "sky" };
const CATEGORY_PALETTE_SET: ReadonlySet<string> = new Set(CATEGORY_PALETTE);

// WidgetCard's color prop only understands the named palette (it needs one
// of these to look up a gradient/border/blob class set) — a category can
// also carry a custom hex color (from ColorPicker's Hex/RGB/CMYK panel),
// which falls back to a neutral card here rather than breaking the lookup.
function widgetColorFor(color: string | undefined): CategoryColor {
  return color && CATEGORY_PALETTE_SET.has(color) ? (color as CategoryColor) : "slate";
}

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

  const heroColor = TYPE_COLOR[type];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
          <button
            onClick={() => setType("transfer")}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              type === "transfer" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            Transfer
          </button>
        </div>
        <FilterDropdown
          value={range === "all" ? "all" : RANGE_LABELS[range]}
          allLabel={RANGE_LABELS.all}
          options={RANGE_ORDER.map((r) => RANGE_LABELS[r])}
          onChange={(next) => setRange(next === "all" ? "all" : LABEL_TO_RANGE[next])}
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <WidgetCard color={heroColor} blob="top-right" delayMs={0}>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
            Total {type === "income" ? "income" : type === "transfer" ? "transferred" : "spent"}
          </p>
          <p className="mt-1.5 font-display text-3xl text-surface-foreground">{formatCurrency(breakdown.total, currency)}</p>
          <p className="mt-1 text-xs text-surface-foreground-soft">
            {breakdown.count} transaction{breakdown.count === 1 ? "" : "s"}
          </p>
        </WidgetCard>

        <div className="rounded-card border border-line bg-gradient-to-br from-bg-soft to-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {type === "income" ? "Income" : type === "transfer" ? "Transfer" : "Spending"} trend
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
      </div>

      {breakdown.rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center animate-[fade-in-up_0.25s_ease-out] motion-reduce:animate-none">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-ink-soft">
            <path d="M3 17V8M10 17V3M17 17v-6" />
          </svg>
          <p className="font-display text-lg text-foreground">No data yet</p>
          <p className="text-sm text-ink-soft">
            {type === "income" ? "Income" : type === "transfer" ? "Transfers" : "Expenses"} for this range will show
            up here once you&apos;ve logged some.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.rows.map((row, i) => (
            <WidgetCard key={row.category} color={widgetColorFor(colorFor(row.category))} blob="none" delayMs={i * 40}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(colorFor(row.category))}`}>
                  {row.category}
                </span>
                <span className="text-sm font-semibold text-surface-foreground">{formatCurrency(row.amount, currency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                <div
                  className="h-full rounded-full bg-navy transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(row.pct, 2)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-surface-foreground-soft">{row.pct.toFixed(1)}% of total</p>
            </WidgetCard>
          ))}
        </div>
      )}
    </div>
  );
}
