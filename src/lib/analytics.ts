// Pure aggregation/period helpers for the new /analytics page — every
// function here operates on data the page already fetched server-side
// (the flat `listExpenses` result, wallets, budgets, recurring rules),
// same "compute it client-side from the flat list" approach the old
// dashboard-widgets system used (there's no dedicated analytics SQL in
// db.ts), just centralized here instead of inlined into a giant
// per-widget switch statement.
import { signedAmount, type Expense } from "@/types/expense";
import type { Budget } from "@/types/budget";
import type { WalletOption } from "@/types/wallet";
import type { RecurringRuleRow } from "@/lib/db";
import { computeEffectiveBudgetLimit } from "@/lib/budget-rollover";
import { monthKey, monthShortLabel, dayKey, weekKey } from "@/lib/format";
import type { TrendPoint } from "@/components/SpendingTrendChart";

export const ANALYTICS_PERIODS = ["thisMonth", "lastMonth", "last3Months", "last6Months", "yearToDate"] as const;
export type AnalyticsPeriodId = (typeof ANALYTICS_PERIODS)[number];

export type AnalyticsPeriod = {
  id: AnalyticsPeriodId;
  /** Inclusive ISO (YYYY-MM-DD) bounds. */
  from: string;
  to: string;
  /** The same-length window immediately before `from`, for vs-previous-period deltas. */
  previousFrom: string;
  previousTo: string;
  /** Suggested trend-chart bucket granularity for this span. */
  bucket: "day" | "week" | "month";
};

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function resolveAnalyticsPeriod(id: AnalyticsPeriodId, today: Date = new Date()): AnalyticsPeriod {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  switch (id) {
    case "lastMonth": {
      const from = new Date(y, m - 1, 1);
      const to = new Date(y, m, 0);
      const previousFrom = new Date(y, m - 2, 1);
      const previousTo = new Date(y, m - 1, 0);
      return { id, from: toIso(from), to: toIso(to), previousFrom: toIso(previousFrom), previousTo: toIso(previousTo), bucket: "day" };
    }
    case "last3Months": {
      const from = new Date(y, m - 2, 1);
      const previousFrom = new Date(y, m - 5, 1);
      const previousTo = new Date(y, m - 2, 0);
      return { id, from: toIso(from), to: toIso(today), previousFrom: toIso(previousFrom), previousTo: toIso(previousTo), bucket: "week" };
    }
    case "last6Months": {
      const from = new Date(y, m - 5, 1);
      const previousFrom = new Date(y, m - 11, 1);
      const previousTo = new Date(y, m - 5, 0);
      return { id, from: toIso(from), to: toIso(today), previousFrom: toIso(previousFrom), previousTo: toIso(previousTo), bucket: "month" };
    }
    case "yearToDate": {
      const from = new Date(y, 0, 1);
      const previousFrom = new Date(y - 1, 0, 1);
      const previousTo = new Date(y - 1, m, d);
      return { id, from: toIso(from), to: toIso(today), previousFrom: toIso(previousFrom), previousTo: toIso(previousTo), bucket: "month" };
    }
    case "thisMonth":
    default: {
      const from = new Date(y, m, 1);
      const previousFrom = new Date(y, m - 1, 1);
      const previousTo = new Date(y, m, 0);
      return { id, from: toIso(from), to: toIso(today), previousFrom: toIso(previousFrom), previousTo: toIso(previousTo), bucket: "day" };
    }
  }
}

export function filterByRange(expenses: Expense[], from: string, to: string): Expense[] {
  return expenses.filter((e) => e.date >= from && e.date <= to);
}

function sumByType(expenses: Expense[], type: "expense" | "income"): number {
  return expenses.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
}

export type PeriodOverview = {
  income: number;
  incomePrev: number;
  expense: number;
  expensePrev: number;
  net: number;
  netPrev: number;
};

// Transfers are deliberately excluded from income/expense totals (same
// convention as the rest of the app — a transfer between your own
// wallets is neither income nor spending), so this can sum by `type`
// directly without the transfer double-counting most other aggregations
// need to guard against.
export function computePeriodOverview(expenses: Expense[], period: AnalyticsPeriod): PeriodOverview {
  const current = filterByRange(expenses, period.from, period.to);
  const previous = filterByRange(expenses, period.previousFrom, period.previousTo);
  const income = sumByType(current, "income");
  const expense = sumByType(current, "expense");
  const incomePrev = sumByType(previous, "income");
  const expensePrev = sumByType(previous, "expense");
  return { income, incomePrev, expense, expensePrev, net: income - expense, netPrev: incomePrev - expensePrev };
}

function shortDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function bucketKeyAndLabelFns(bucket: AnalyticsPeriod["bucket"]) {
  if (bucket === "day") return { keyFn: dayKey, labelFn: shortDayLabel };
  if (bucket === "week") return { keyFn: weekKey, labelFn: shortDayLabel };
  return { keyFn: monthKey, labelFn: monthShortLabel };
}

// Feeds SpendingTrendChart's `points` prop directly.
export function bucketExpensesByPeriod(expenses: Expense[], period: AnalyticsPeriod, kind: "expense" | "income" = "expense"): TrendPoint[] {
  const relevant = filterByRange(expenses, period.from, period.to).filter((e) => e.type === kind);
  const { keyFn, labelFn } = bucketKeyAndLabelFns(period.bucket);
  const map = new Map<string, number>();
  for (const e of relevant) {
    const key = keyFn(e.date);
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, amount]) => ({ key, label: labelFn(key), amount }));
}

// Reconstructs a historical net-worth series with no new DB storage —
// today's real net worth is known, and every transaction's signed
// contribution is known, so balance(day) = balance(day+1) minus
// whatever posted on day+1. Walks backward one calendar day at a time
// from today to the period's start, then buckets those daily snapshots
// down to the period's own granularity, keeping each bucket's most
// recent day (a point-in-time balance, not a sum).
export function reconstructNetWorthHistory(expenses: Expense[], currentNetWorth: number, period: AnalyticsPeriod, todayIso: string): TrendPoint[] {
  const deltaByDate = new Map<string, number>();
  for (const e of expenses) {
    if (e.date > todayIso || e.date < period.from) continue;
    deltaByDate.set(e.date, (deltaByDate.get(e.date) ?? 0) + signedAmount(e));
  }

  const dayBalances = new Map<string, number>();
  let running = currentNetWorth;
  let cursor = parseIsoDate(todayIso);
  const start = parseIsoDate(period.from);
  while (cursor.getTime() >= start.getTime()) {
    const key = toIso(cursor);
    dayBalances.set(key, running);
    running -= deltaByDate.get(key) ?? 0;
    cursor = addDays(cursor, -1);
  }

  const { keyFn, labelFn } = bucketKeyAndLabelFns(period.bucket);
  const bucketed = new Map<string, { day: string; amount: number }>();
  for (const [day, amount] of dayBalances) {
    const bucketKey = keyFn(day);
    const existing = bucketed.get(bucketKey);
    if (!existing || day > existing.day) bucketed.set(bucketKey, { day, amount });
  }
  return Array.from(bucketed.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, v]) => ({ key, label: labelFn(key), amount: v.amount }));
}

export function rankWalletsByBalance(wallets: WalletOption[]): WalletOption[] {
  return wallets.filter((w) => !w.archived).sort((a, b) => b.balance - a.balance);
}

export type BudgetProgress = {
  category: string;
  limit: number;
  spent: number;
  percent: number;
};

// Budgets are inherently a calendar-month concept (monthly limits,
// optionally rolling over month to month) — always "this month",
// independent of the page's own selected period.
export function budgetsForThisMonth(budgets: Budget[], expenses: Expense[], todayIso: string): BudgetProgress[] {
  const mk = monthKey(todayIso);
  return budgets.map((b) => {
    const limit = computeEffectiveBudgetLimit(expenses, b, mk);
    const spent = expenses
      .filter((e) => e.type === "expense" && e.category === b.category && monthKey(e.date) === mk)
      .reduce((s, e) => s + e.amount, 0);
    return { category: b.category, limit, spent, percent: limit > 0 ? Math.round((spent / limit) * 100) : 0 };
  });
}

export type UpcomingRecurringItem = {
  id: number;
  merchant: string;
  category: string;
  amount: number;
  type: string;
  direction: string | null;
  nextRunDate: string;
  daysUntil: number;
};

export function upcomingRecurring(rules: RecurringRuleRow[], todayIso: string, limit = 5): UpcomingRecurringItem[] {
  const today = parseIsoDate(todayIso);
  return rules
    .filter((r) => r.active)
    .map((r) => {
      const next = parseIsoDate(r.next_run_date);
      const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
      return {
        id: r.id,
        merchant: r.merchant,
        category: r.category,
        amount: Number(r.amount),
        type: r.type,
        direction: r.direction,
        nextRunDate: r.next_run_date,
        daysUntil,
      };
    })
    .sort((a, b) => (a.nextRunDate < b.nextRunDate ? -1 : 1))
    .slice(0, limit);
}

export type ProjectedSpend = {
  spent: number;
  projected: number;
  daysElapsed: number;
  daysInMonth: number;
};

// A simple linear pace projection (spent-so-far ÷ days-elapsed ×
// days-in-month) — always for the current calendar month, same
// month-scoping reasoning as budgetsForThisMonth.
export function projectedMonthEndSpend(expenses: Expense[], todayIso: string): ProjectedSpend {
  const today = parseIsoDate(todayIso);
  const mk = monthKey(todayIso);
  const spent = expenses
    .filter((e) => e.type === "expense" && monthKey(e.date) === mk)
    .reduce((s, e) => s + e.amount, 0);
  const daysElapsed = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projected = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : spent;
  return { spent, projected, daysElapsed, daysInMonth };
}
