"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { accentTextClasses, accentBgClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { useWallets } from "@/lib/wallets-context";
import SummaryCards from "./SummaryCards";
import CategoryOverview from "./CategoryOverview";
import WalletsWidget from "./WalletsWidget";
import RecentTransactionsWidget from "./RecentTransactionsWidget";
import StatWidget from "./StatWidget";
import ListStatWidget from "./ListStatWidget";
import QuickStatsWidget from "./QuickStatsWidget";
import MiniBarChartWidget from "./MiniBarChartWidget";

function noop() {}

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysAgoKey(n: number): string {
  const today = todayInputValue();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - n);
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekKey(): string {
  const today = todayInputValue();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay());
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function weekdayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

function sum(expenses: Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}

function groupSum<T>(expenses: Expense[], keyOf: (e: Expense) => T): Map<T, number> {
  const map = new Map<T, number>();
  for (const e of expenses) map.set(keyOf(e), (map.get(keyOf(e)) ?? 0) + e.amount);
  return map;
}

function topEntry<T>(map: Map<T, number>): [T, number] | null {
  let best: [T, number] | null = null;
  for (const entry of map) {
    if (!best || entry[1] > best[1]) best = entry;
  }
  return best;
}

// Renders the actual widget for a given instance — shared between the live
// Dashboard and the Customize dashboard preview, so what you see while
// rearranging is exactly what you'll see afterward.
export default function DashboardWidgetContent({
  widget,
  expenses,
  categories,
  remaining,
  onEditBalance,
  onAddIncome,
  onAddExpense,
}: {
  widget: DashboardWidgetInstance;
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
  onEditBalance?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}) {
  const currency = useCurrency();
  const wallets = useWallets();

  const today = todayInputValue();
  const currentMonthKey = monthKey(today);
  const lastMonthKey = monthKey(daysAgoKey(30));
  const thisYear = today.slice(0, 4);
  const weekStart = startOfWeekKey();

  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);
  const monthExpenses = thisMonth.filter((e) => e.type === "expense");
  const monthIncomeItems = thisMonth.filter((e) => e.type === "income");
  const monthIncome = sum(monthIncomeItems);
  const monthSpent = sum(monthExpenses);
  const accentText = accentTextClasses(widget.accent);
  const accentBg = accentBgClasses(widget.accent);

  switch (widget.type) {
    case "summary":
      return (
        <SummaryCards
          expenses={expenses}
          remaining={remaining}
          cards={widget.cards}
          onEditBalance={onEditBalance ?? noop}
          onAddIncome={onAddIncome ?? noop}
          onAddExpense={onAddExpense ?? noop}
        />
      );
    case "categoryOverview":
      return <CategoryOverview expenses={expenses} categories={categories} />;
    case "wallets":
      return <WalletsWidget />;
    case "recentTransactions":
      return <RecentTransactionsWidget expenses={expenses} limit={widget.limit} />;

    case "todaySpending": {
      const value = sum(expenses.filter((e) => e.type === "expense" && e.date === today));
      return <StatWidget label="Today's spending" value={formatCurrency(value, currency)} valueClassName={accentText} />;
    }
    case "weekSpending": {
      const value = sum(expenses.filter((e) => e.type === "expense" && e.date >= weekStart));
      return <StatWidget label="This week's spending" value={formatCurrency(value, currency)} valueClassName={accentText} />;
    }
    case "yearSpending": {
      const value = sum(expenses.filter((e) => e.type === "expense" && e.date.startsWith(thisYear)));
      return <StatWidget label="This year's spending" value={formatCurrency(value, currency)} valueClassName={accentText} />;
    }
    case "avgDailySpending": {
      const dayOfMonth = Number(today.slice(8, 10));
      const value = monthSpent / Math.max(1, dayOfMonth);
      return (
        <StatWidget
          label="Average daily spending"
          value={formatCurrency(value, currency)}
          sublabel="This month"
          valueClassName={accentText}
        />
      );
    }
    case "avgTransactionAmount": {
      const value = monthExpenses.length > 0 ? monthSpent / monthExpenses.length : 0;
      return (
        <StatWidget
          label="Average transaction"
          value={formatCurrency(value, currency)}
          sublabel="This month"
          valueClassName={accentText}
        />
      );
    }
    case "transactionCount": {
      return (
        <StatWidget label="Transaction count" value={String(thisMonth.length)} sublabel="This month" valueClassName={accentText} />
      );
    }
    case "biggestExpense": {
      const biggest = monthExpenses.reduce<Expense | null>(
        (max, e) => (!max || e.amount > max.amount ? e : max),
        null,
      );
      return (
        <StatWidget
          label="Biggest expense"
          value={biggest ? formatCurrency(biggest.amount, currency) : "—"}
          sublabel={biggest ? biggest.merchant : "No expenses this month"}
          valueClassName={accentText}
        />
      );
    }
    case "topCategory": {
      const top = topEntry(groupSum(monthExpenses, (e) => e.category));
      return (
        <StatWidget
          label="Top category"
          value={top ? top[0] : "—"}
          sublabel={top ? formatCurrency(top[1], currency) : "No expenses this month"}
          valueClassName={accentText}
        />
      );
    }
    case "topMerchant": {
      const top = topEntry(groupSum(monthExpenses, (e) => e.merchant));
      return (
        <StatWidget
          label="Top merchant"
          value={top ? top[0] : "—"}
          sublabel={top ? formatCurrency(top[1], currency) : "No expenses this month"}
          valueClassName={accentText}
        />
      );
    }
    case "savingsRate": {
      const rate = monthIncome > 0 ? ((monthIncome - monthSpent) / monthIncome) * 100 : 0;
      return (
        <StatWidget
          label="Savings rate"
          value={monthIncome > 0 ? `${rate.toFixed(0)}%` : "—"}
          sublabel="This month"
          valueClassName={rate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
        />
      );
    }
    case "netWorth":
      return (
        <StatWidget
          label="Net worth"
          value={formatCurrency(remaining, currency)}
          sublabel="All wallets combined"
          valueClassName={accentText}
        />
      );
    case "monthComparison": {
      const lastMonthSpent = sum(
        expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey),
      );
      const diff = monthSpent - lastMonthSpent;
      const pct = lastMonthSpent > 0 ? (diff / lastMonthSpent) * 100 : null;
      return (
        <StatWidget
          label="Month vs last month"
          value={pct === null ? formatCurrency(monthSpent, currency) : `${diff >= 0 ? "+" : ""}${pct.toFixed(0)}%`}
          sublabel={`${formatCurrency(monthSpent, currency)} vs ${formatCurrency(lastMonthSpent, currency)}`}
          valueClassName={diff > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
        />
      );
    }
    case "transfersTotal": {
      const value = sum(thisMonth.filter((e) => e.type === "transfer"));
      return <StatWidget label="Transfers total" value={formatCurrency(value, currency)} sublabel="This month" valueClassName={accentText} />;
    }
    case "topIncomeSource": {
      const top = topEntry(groupSum(monthIncomeItems, (e) => e.category));
      return (
        <StatWidget
          label="Top income source"
          value={top ? top[0] : "—"}
          sublabel={top ? formatCurrency(top[1], currency) : "No income this month"}
          valueClassName={accentText}
        />
      );
    }
    case "last7Days": {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const key = daysAgoKey(6 - i);
        return { label: weekdayLabel(key), value: sum(expenses.filter((e) => e.type === "expense" && e.date === key)) };
      });
      return <MiniBarChartWidget title="Last 7 days" bars={bars} barClassName={accentBg} />;
    }
    case "last30Days": {
      const bars = Array.from({ length: 30 }, (_, i) => {
        const key = daysAgoKey(29 - i);
        return { label: key, value: sum(expenses.filter((e) => e.type === "expense" && e.date === key)) };
      });
      return <MiniBarChartWidget title="Last 30 days" bars={bars} barClassName={accentBg} />;
    }
    case "topCategories": {
      const items = [...groupSum(monthExpenses, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value]) => ({ label, value, displayValue: formatCurrency(value, currency) }));
      return <ListStatWidget title="Top categories" items={items} barClassName={accentBg} />;
    }
    case "walletDistribution": {
      const items = wallets.map((w) => ({ label: w.name, value: Math.max(w.balance, 0), displayValue: formatCurrency(w.balance, currency) }));
      return <ListStatWidget title="Wallet distribution" items={items} barClassName={accentBg} />;
    }
    case "topTags": {
      const counts = new Map<string, number>();
      for (const e of expenses) for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const items = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value]) => ({ label: `#${label}`, value, displayValue: String(value) }));
      return <ListStatWidget title="Top tags" items={items} barClassName={accentBg} />;
    }
    case "quickStats": {
      const avg = monthExpenses.length > 0 ? monthSpent / monthExpenses.length : 0;
      return (
        <QuickStatsWidget
          title="Quick stats"
          stats={[
            { label: "Income", value: formatCurrency(monthIncome, currency), valueClassName: "text-emerald-600 dark:text-emerald-400" },
            { label: "Expenses", value: formatCurrency(monthSpent, currency), valueClassName: "text-red-600 dark:text-red-400" },
            { label: "Transactions", value: String(thisMonth.length), valueClassName: accentText },
            { label: "Avg. transaction", value: formatCurrency(avg, currency), valueClassName: accentText },
          ]}
        />
      );
    }
    case "expensesByWallet": {
      const items = [...groupSum(monthExpenses, (e) => e.walletName ?? "Unassigned").entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({ label, value, displayValue: formatCurrency(value, currency) }));
      return <ListStatWidget title="Spending by wallet" items={items} barClassName={accentBg} />;
    }
    case "yearToDateIncome": {
      const value = sum(expenses.filter((e) => e.type === "income" && e.date.startsWith(thisYear)));
      return <StatWidget label="Year-to-date income" value={formatCurrency(value, currency)} valueClassName="text-emerald-600 dark:text-emerald-400" />;
    }
    case "largestWallet": {
      const largest = wallets.reduce<(typeof wallets)[number] | null>(
        (max, w) => (!max || w.balance > max.balance ? w : max),
        null,
      );
      return (
        <StatWidget
          label="Largest wallet"
          value={largest ? largest.name : "—"}
          sublabel={largest ? formatCurrency(largest.balance, currency) : "No wallets yet"}
          valueClassName={accentText}
        />
      );
    }
    case "totalBalance": {
      const total = wallets.reduce((sum, w) => sum + w.balance, 0);
      return (
        <StatWidget
          label="Total balance"
          value={formatCurrency(total, currency)}
          sublabel={`Across ${wallets.length} active wallet${wallets.length === 1 ? "" : "s"}`}
          valueClassName={accentText}
        />
      );
    }
    default:
      return null;
  }
}
