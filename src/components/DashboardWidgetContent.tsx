"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { Budget } from "@/types/budget";
import type { SavingsGoal } from "@/types/savings-goal";
import type { DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { computeEffectiveBudgetLimit } from "@/lib/budget-rollover";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { accentTextClasses, accentBgClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { useWallets } from "@/lib/wallets-context";
import SummaryCards from "./SummaryCards";
import CategoryOverview from "./CategoryOverview";
import WalletsWidget from "./WalletsWidget";
import RecentTransactionsWidget from "./RecentTransactionsWidget";
import StatWidget from "./StatWidget";
import ProgressRingWidget from "./ProgressRingWidget";
import GaugeWidget from "./GaugeWidget";
import DonutChartWidget from "./DonutChartWidget";
import HeatmapWidget from "./HeatmapWidget";
import ComparisonBarsWidget from "./ComparisonBarsWidget";
import StackedBarWidget from "./StackedBarWidget";
import MiniBarChartWidget from "./MiniBarChartWidget";
import TickerCardWidget from "./TickerCardWidget";
import PillStatWidget from "./PillStatWidget";
import AlertPillWidget from "./AlertPillWidget";
import WeekdayTrackerWidget from "./WeekdayTrackerWidget";
import BalanceHeroWidget from "./BalanceHeroWidget";
import WelcomeWidget from "./WelcomeWidget";
import StepperProgressWidget from "./StepperProgressWidget";
import CornerArrowStatWidget from "./CornerArrowStatWidget";
import BudgetOverviewWidget from "./BudgetOverviewWidget";
import SavingsGoalsWidget from "./SavingsGoalsWidget";
import IncomeStatCard from "./IncomeStatCard";
import IncomeAreaSparkWidget from "./IncomeAreaSparkWidget";
import IncomeSourcesRankedWidget from "./IncomeSourcesRankedWidget";
import ExpenseStatCard from "./ExpenseStatCard";
import ExpenseAreaSparkWidget from "./ExpenseAreaSparkWidget";
import ExpenseRankedWidget from "./ExpenseRankedWidget";
import ExpenseLeaderboardWidget from "./ExpenseLeaderboardWidget";
import WalletStatCard from "./WalletStatCard";
import WalletRankedWidget from "./WalletRankedWidget";
import BalanceStatCard from "./BalanceStatCard";

function noop() {}

function TickerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M3 13l4-4 3 3 7-7" />
      <path d="M13 5h4v4" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  );
}

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

function monthsAgoKey(n: number): string {
  const today = todayInputValue();
  const [y, m] = today.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() - n);
  return monthKey(toKey(date.getFullYear(), date.getMonth(), 1));
}

function startOfWeekKey(): string {
  const today = todayInputValue();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay());
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function toKeyOffsetFromWeekStart(weekStart: string, offset: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offset);
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

function colorFor(index: number): string {
  return WIDGET_ACCENTS[index % WIDGET_ACCENTS.length];
}

// Renders the actual widget for a given instance — shared between the live
// Dashboard and the Customize dashboard preview, so what you see while
// rearranging is exactly what you'll see afterward.
export default function DashboardWidgetContent({
  widget,
  expenses,
  categories,
  remaining,
  convertedNetWorth,
  budgets = [],
  savingsGoals = [],
  onEditBalance,
  onAddIncome,
  onAddExpense,
  onAddTransfer,
  username,
}: {
  widget: DashboardWidgetInstance;
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
  /** Optional currency-converted net worth for the "netWorth" widget — falls back to `remaining` when not provided (e.g. in the Customize dashboard preview). */
  convertedNetWorth?: number;
  budgets?: Budget[];
  savingsGoals?: SavingsGoal[];
  onEditBalance?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onAddTransfer?: () => void;
  /** Optional — falls back to a generic greeting in the Customize dashboard preview, where no user context is loaded. */
  username?: string;
}) {
  const currency = useCurrency();
  const wallets = useWallets();

  const today = todayInputValue();
  const currentMonthKey = monthKey(today);
  const lastMonthKey = monthsAgoKey(1);
  const lastWeekStart = daysAgoKey(13);
  const lastWeekEnd = daysAgoKey(7);
  const weekStart = startOfWeekKey();
  const thisYear = today.slice(0, 4);
  const lastYear = String(Number(thisYear) - 1);

  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);
  const monthExpenses = thisMonth.filter((e) => e.type === "expense");
  const monthIncomeItems = thisMonth.filter((e) => e.type === "income");
  const monthIncome = sum(monthIncomeItems);
  const monthSpent = sum(monthExpenses);
  const accentText = accentTextClasses(widget.accent);
  const accentBg = accentBgClasses(widget.accent);

  switch (widget.type) {
    case "welcome": {
      const scopedWallet = widget.walletId != null ? wallets.find((w) => w.id === widget.walletId) : undefined;
      return (
        <WelcomeWidget
          username={username ?? "there"}
          remaining={scopedWallet ? scopedWallet.balance : remaining}
          balanceLabel={scopedWallet ? scopedWallet.name : "All Accounts • Total Balance"}
          onAddExpense={widget.hideAction ? undefined : (onAddExpense ?? noop)}
          onAddIncome={widget.hideAction ? undefined : (onAddIncome ?? noop)}
          onAddTransfer={widget.hideAction ? undefined : (onAddTransfer ?? noop)}
        />
      );
    }
    case "summary":
      return (
        <SummaryCards
          expenses={expenses}
          remaining={remaining}
          cards={widget.cards}
          onEditBalance={widget.hideAction ? undefined : (onEditBalance ?? noop)}
          onAddIncome={widget.hideAction ? undefined : (onAddIncome ?? noop)}
          onAddExpense={widget.hideAction ? undefined : (onAddExpense ?? noop)}
        />
      );
    case "categoryOverview":
      return <CategoryOverview expenses={expenses} categories={categories} />;
    case "wallets":
      return <WalletsWidget />;
    case "recentTransactions":
      return <RecentTransactionsWidget expenses={expenses} limit={widget.limit} />;

    case "incomeCard":
      return (
        <IncomeStatCard
          label="Income"
          value={formatCurrency(monthIncome, currency)}
          currencyCode={currency}
          onClick={widget.hideAction ? undefined : (onAddIncome ?? noop)}
        />
      );
    case "expensesCard":
      return (
        <ExpenseStatCard
          label="Expenses"
          value={formatCurrency(monthSpent, currency)}
          currencyCode={currency}
          onClick={widget.hideAction ? undefined : (onAddExpense ?? noop)}
        />
      );
    case "remainingCard":
      return (
        <BalanceStatCard
          label="Remaining"
          value={`${remaining < 0 ? "-" : ""}${formatCurrency(Math.abs(remaining), currency)}`}
          currencyCode={currency}
          negative={remaining < 0}
          onClick={widget.hideAction ? undefined : (onEditBalance ?? noop)}
        />
      );

    // ---- Big numbers ----
    case "todaySpending":
      return <ExpenseStatCard label="Today's spending" value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date === today)), currency)} />;
    case "yesterdaySpending": {
      const y = daysAgoKey(1);
      return <ExpenseStatCard label="Yesterday's spending" value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date === y)), currency)} />;
    }
    case "weekSpending":
      return <ExpenseStatCard label="This week's spending" value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date >= weekStart)), currency)} />;
    case "monthSpending":
      return <ExpenseStatCard label="This month's spending" value={formatCurrency(monthSpent, currency)} />;
    case "yearSpending":
      return (
        <ExpenseStatCard
          label="This year's spending"
          value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date.startsWith(thisYear))), currency)}
        />
      );
    case "todayIncome":
      return <IncomeStatCard label="Today's income" value={formatCurrency(sum(expenses.filter((e) => e.type === "income" && e.date === today)), currency)} />;
    case "monthIncome":
      return <IncomeStatCard label="This month's income" value={formatCurrency(monthIncome, currency)} />;
    case "yearIncome":
      return (
        <IncomeStatCard
          label="This year's income"
          value={formatCurrency(sum(expenses.filter((e) => e.type === "income" && e.date.startsWith(thisYear))), currency)}
        />
      );
    case "netWorth":
      return <WalletStatCard label="Net worth" value={formatCurrency(convertedNetWorth ?? remaining, currency)} sublabel="All wallets combined" />;
    case "totalBalance": {
      const total = wallets.reduce((s, w) => s + w.balance, 0);
      return (
        <WalletStatCard
          label="Total balance"
          value={formatCurrency(total, currency)}
          sublabel={`Across ${wallets.length} active wallet${wallets.length === 1 ? "" : "s"}`}
        />
      );
    }
    case "avgDailySpending": {
      const dayOfMonth = Number(today.slice(8, 10));
      return (
        <ExpenseStatCard
          label="Average daily spending"
          value={formatCurrency(monthSpent / Math.max(1, dayOfMonth), currency)}
          sublabel="This month"
        />
      );
    }
    case "avgTransactionAmount":
      return (
        <ExpenseStatCard
          label="Average transaction"
          value={formatCurrency(monthExpenses.length > 0 ? monthSpent / monthExpenses.length : 0, currency)}
          sublabel="This month"
        />
      );
    case "avgIncomeAmount":
      return (
        <IncomeStatCard
          label="Average income"
          value={formatCurrency(monthIncomeItems.length > 0 ? monthIncome / monthIncomeItems.length : 0, currency)}
          sublabel="This month"
        />
      );
    case "biggestExpense": {
      const biggest = monthExpenses.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);
      return (
        <ExpenseStatCard
          label="Biggest expense"
          value={biggest ? formatCurrency(biggest.amount, currency) : "—"}
          sublabel={biggest ? biggest.merchant : "No expenses this month"}
        />
      );
    }
    case "biggestIncome": {
      const biggest = monthIncomeItems.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);
      return (
        <IncomeStatCard
          label="Biggest income"
          value={biggest ? formatCurrency(biggest.amount, currency) : "—"}
          sublabel={biggest ? biggest.merchant : "No income this month"}
        />
      );
    }
    case "transactionCount":
      return <StatWidget label="Transaction count" value={String(thisMonth.length)} sublabel="This month" valueClassName={accentText} />;
    case "transfersTotal":
      return (
        <StatWidget
          label="Transfers total"
          value={formatCurrency(sum(thisMonth.filter((e) => e.type === "transfer")), currency)}
          sublabel="This month"
          valueClassName={accentText}
        />
      );
    case "walletCount":
      return <StatWidget label="Wallet count" value={String(wallets.length)} sublabel="Active wallets" valueClassName={accentText} />;
    case "categoryCount": {
      const distinct = new Set(thisMonth.map((e) => e.category));
      return <StatWidget label="Categories used" value={String(distinct.size)} sublabel="This month" valueClassName={accentText} />;
    }
    case "tagCount": {
      const distinct = new Set(thisMonth.flatMap((e) => e.tags));
      return <StatWidget label="Tags used" value={String(distinct.size)} sublabel="This month" valueClassName={accentText} />;
    }

    // ---- Trend arrows ----
    case "monthComparison": {
      const lastMonthSpent = sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey));
      const pct = lastMonthSpent > 0 ? ((monthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
      return (
        <ExpenseStatCard
          label="Month vs last month"
          value={formatCurrency(monthSpent, currency)}
          sublabel={`vs ${formatCurrency(lastMonthSpent, currency)} last month`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 1 }}
        />
      );
    }
    case "incomeComparison": {
      const lastMonthIncome = sum(expenses.filter((e) => e.type === "income" && monthKey(e.date) === lastMonthKey));
      const pct = lastMonthIncome > 0 ? ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      return (
        <IncomeStatCard
          label="Income vs last month"
          value={formatCurrency(monthIncome, currency)}
          sublabel={`vs ${formatCurrency(lastMonthIncome, currency)} last month`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct >= 0 }}
        />
      );
    }
    case "weekComparison": {
      const thisWeekSpent = sum(expenses.filter((e) => e.type === "expense" && e.date >= weekStart));
      const lastWeekSpent = sum(expenses.filter((e) => e.type === "expense" && e.date >= lastWeekStart && e.date < lastWeekEnd));
      const pct = lastWeekSpent > 0 ? ((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100 : 0;
      return (
        <ExpenseStatCard
          label="Week vs last week"
          value={formatCurrency(thisWeekSpent, currency)}
          sublabel={`vs ${formatCurrency(lastWeekSpent, currency)} last week`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 1 }}
        />
      );
    }
    case "yearOverYear": {
      const thisYearSpent = sum(expenses.filter((e) => e.type === "expense" && e.date.startsWith(thisYear)));
      const lastYearSpent = sum(expenses.filter((e) => e.type === "expense" && e.date.startsWith(lastYear)));
      const pct = lastYearSpent > 0 ? ((thisYearSpent - lastYearSpent) / lastYearSpent) * 100 : 0;
      return (
        <ExpenseStatCard
          label="Year over year"
          value={formatCurrency(thisYearSpent, currency)}
          sublabel={`vs ${formatCurrency(lastYearSpent, currency)} last year`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 1 }}
        />
      );
    }

    // ---- Rings & gauges ----
    case "savingsRate": {
      const rate = monthIncome > 0 ? ((monthIncome - monthSpent) / monthIncome) * 100 : 0;
      return (
        <ProgressRingWidget
          label="Savings rate"
          percent={rate}
          centerValue={monthIncome > 0 ? `${rate.toFixed(0)}%` : "—"}
          sublabel="This month"
          ringClassName={widget.accent ? accentText : rate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
        />
      );
    }
    case "monthProgress": {
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const pct = (dayOfMonth / daysInMonth) * 100;
      return (
        <ProgressRingWidget
          label="Month progress"
          percent={pct}
          centerValue={`Day ${dayOfMonth}`}
          sublabel={`of ${daysInMonth}`}
          ringClassName={accentText}
        />
      );
    }
    case "yearProgress": {
      const start = new Date(Number(thisYear), 0, 1);
      const end = new Date(Number(thisYear) + 1, 0, 1);
      const now = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
      const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
      const pct = (dayOfYear / totalDays) * 100;
      return <ProgressRingWidget label="Year progress" percent={pct} centerValue={`${pct.toFixed(0)}%`} sublabel={thisYear} ringClassName={accentText} />;
    }
    case "spendPace": {
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const expectedPct = (dayOfMonth / daysInMonth) * 100;
      const lastMonthSpent = sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey));
      const pacePct = lastMonthSpent > 0 ? (monthSpent / lastMonthSpent) * 100 : expectedPct;
      return (
        <GaugeWidget
          label="Spending pace"
          percent={pacePct}
          sublabel={pacePct > expectedPct + 5 ? "Ahead of last month's pace" : pacePct < expectedPct - 5 ? "Behind last month's pace" : "On pace"}
          needleClassName={widget.accent ? accentText : "text-rose-500 dark:text-rose-400"}
        />
      );
    }
    case "walletUsage": {
      const wallet = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (!wallet) return <StatWidget label="Wallet usage" value="—" sublabel="No wallets yet" />;
      const totalBalance = wallets.reduce((s, w) => s + Math.max(w.balance, 0), 0);
      const share = totalBalance > 0 ? (Math.max(wallet.balance, 0) / totalBalance) * 100 : 0;
      return (
        <GaugeWidget
          label={`${wallet.name} share`}
          percent={share}
          sublabel={formatCurrency(wallet.balance, currency)}
          needleClassName={widget.accent ? accentText : "text-sky-500 dark:text-sky-400"}
        />
      );
    }

    // ---- Sparklines ----
    case "last14DaysSpark": {
      const points = Array.from({ length: 14 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(13 - i))));
      return <ExpenseAreaSparkWidget label="14-day spending trend" value={formatCurrency(points.reduce((a, b) => a + b, 0), currency)} points={points} />;
    }
    case "last14DaysIncomeSpark": {
      const points = Array.from({ length: 14 }, (_, i) => sum(expenses.filter((e) => e.type === "income" && e.date === daysAgoKey(13 - i))));
      return <IncomeAreaSparkWidget label="14-day income trend" value={formatCurrency(points.reduce((a, b) => a + b, 0), currency)} points={points} />;
    }
    case "last6MonthsSpark": {
      const points = Array.from({ length: 6 }, (_, i) => {
        const mk = monthsAgoKey(5 - i);
        return sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === mk));
      });
      return <ExpenseAreaSparkWidget label="6-month spending trend" value={formatCurrency(monthSpent, currency)} points={points} />;
    }

    // ---- Donuts ----
    case "categoryDonut": {
      const entries = [...groupSum(monthExpenses, (e) => e.category).entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const segments = entries.map(([label, value], i) => ({
        label,
        value,
        displayValue: formatCurrency(value, currency),
        colorClassName: accentTextClasses(colorFor(i)),
      }));
      return <DonutChartWidget title="Category split" segments={segments} />;
    }
    case "typeDonut": {
      const segments = (["expense", "income", "transfer"] as const).map((t, i) => ({
        label: t === "expense" ? "Expense" : t === "income" ? "Income" : "Transfer",
        value: thisMonth.filter((e) => e.type === t).length,
        displayValue: String(thisMonth.filter((e) => e.type === t).length),
        colorClassName: accentTextClasses(colorFor(i)),
      }));
      return <DonutChartWidget title="Transaction mix" segments={segments} />;
    }
    case "walletDonut": {
      const segments = wallets.map((w, i) => ({
        label: w.name,
        value: Math.max(w.balance, 0),
        displayValue: formatCurrency(w.balance, currency),
        colorClassName: accentTextClasses(colorFor(i)),
      }));
      return <DonutChartWidget title="Balance split" segments={segments} />;
    }

    // ---- Heatmaps ----
    case "last30DaysHeatmap": {
      const values = Array.from({ length: 30 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(29 - i))));
      const max = Math.max(...values, 1);
      const cells = values.map((v, i) => ({ date: daysAgoKey(29 - i), intensity: v / max }));
      return <HeatmapWidget title="30-day activity" cells={cells} colorClassName={widget.accent ? accentBg : "bg-rose-500"} />;
    }
    case "last90DaysHeatmap": {
      const values = Array.from({ length: 90 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(89 - i))));
      const max = Math.max(...values, 1);
      const cells = values.map((v, i) => ({ date: daysAgoKey(89 - i), intensity: v / max }));
      return <HeatmapWidget title="90-day activity" cells={cells} colorClassName={widget.accent ? accentBg : "bg-rose-500"} />;
    }

    // ---- Stacked bars ----
    case "walletShareBar": {
      const total = wallets.reduce((s, w) => s + Math.max(w.balance, 0), 0);
      const segments = wallets.map((w, i) => ({
        label: w.name,
        value: Math.max(w.balance, 0),
        displayValue: formatCurrency(w.balance, currency),
        colorClassName: accentBgClasses(colorFor(i)),
      }));
      return total > 0 ? <StackedBarWidget title="Wallet share" segments={segments} /> : <StackedBarWidget title="Wallet share" segments={[]} />;
    }
    case "categoryShareBar": {
      const entries = [...groupSum(monthExpenses, (e) => e.category).entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const segments = entries.map(([label, value], i) => ({
        label,
        value,
        displayValue: formatCurrency(value, currency),
        colorClassName: accentBgClasses(colorFor(i)),
      }));
      return <StackedBarWidget title="Category share" segments={segments} />;
    }

    // ---- Comparison bars ----
    case "incomeVsExpenseBars":
      return (
        <ComparisonBarsWidget
          title="Income vs expenses"
          barA={{ label: "Income", value: monthIncome, displayValue: formatCurrency(monthIncome, currency), colorClassName: "bg-emerald-500" }}
          barB={{ label: "Expenses", value: monthSpent, displayValue: formatCurrency(monthSpent, currency), colorClassName: "bg-red-500" }}
        />
      );
    case "cashVsDigitalBars": {
      const cash = wallets.filter((w) => w.kind === "cash").reduce((s, w) => s + w.balance, 0);
      const digital = wallets.filter((w) => w.kind === "digital").reduce((s, w) => s + w.balance, 0);
      return (
        <ComparisonBarsWidget
          title="Cash vs digital"
          barA={{ label: "Cash", value: Math.max(cash, 0), displayValue: formatCurrency(cash, currency), colorClassName: "bg-amber-500" }}
          barB={{ label: "Digital", value: Math.max(digital, 0), displayValue: formatCurrency(digital, currency), colorClassName: "bg-sky-500" }}
        />
      );
    }

    // ---- Ranked bar lists ----
    case "topCategories": {
      const items = [...groupSum(monthExpenses, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title="Top categories" items={items} />;
    }
    case "topMerchants": {
      const items = [...groupSum(monthExpenses, (e) => e.merchant).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title="Top merchants" items={items} />;
    }
    case "topTags": {
      const counts = new Map<string, number>();
      for (const e of expenses) for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const items = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label: `#${label}`, value, displayValue: String(value), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title="Top tags" items={items} />;
    }
    case "topIncomeSources": {
      const items = [...groupSum(monthIncomeItems, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <IncomeSourcesRankedWidget title="Top income sources" items={items} />;
    }
    case "walletDistribution": {
      const items = wallets.map((w, i) => ({ label: w.name, value: Math.max(w.balance, 0), displayValue: formatCurrency(w.balance, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <WalletRankedWidget title="Wallet distribution" items={items} />;
    }
    case "expensesByWallet": {
      const items = [...groupSum(monthExpenses, (e) => e.walletName ?? "Unassigned").entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <WalletRankedWidget title="Spending by wallet" items={items} />;
    }

    // ---- Leaderboards ----
    case "topMerchantsLeaderboard": {
      const items = [...groupSum(monthExpenses, (e) => e.merchant).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 3)
        .map(([label, value]) => ({ label, displayValue: formatCurrency(value, currency) }));
      return <ExpenseLeaderboardWidget title="Merchant leaderboard" items={items} />;
    }
    case "topCategoriesLeaderboard": {
      const items = [...groupSum(monthExpenses, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 3)
        .map(([label, value]) => ({ label, displayValue: formatCurrency(value, currency) }));
      return <ExpenseLeaderboardWidget title="Category leaderboard" items={items} />;
    }

    // ---- Bar chart ----
    case "last7Days": {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const key = daysAgoKey(6 - i);
        return { label: weekdayLabel(key), value: sum(expenses.filter((e) => e.type === "expense" && e.date === key)) };
      });
      return <MiniBarChartWidget title="Last 7 days" bars={bars} barClassName={widget.accent ? accentBg : "bg-rose-500"} />;
    }

    // ---- Creative widgets ----
    case "netWorthTicker": {
      const points = Array.from({ length: 14 }, (_, i) => {
        const key = daysAgoKey(13 - i);
        const spentUpTo = sum(expenses.filter((e) => e.type === "expense" && e.date <= key));
        const earnedUpTo = sum(expenses.filter((e) => e.type === "income" && e.date <= key));
        return remaining - earnedUpTo + spentUpTo;
      });
      const first = points[0] ?? remaining;
      const deltaPct = first !== 0 ? ((remaining - first) / Math.abs(first)) * 100 : 0;
      return (
        <TickerCardWidget
          icon={<TickerIcon />}
          name="Net worth"
          value={formatCurrency(remaining, currency)}
          deltaLabel={`${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`}
          deltaPositive={deltaPct >= 0}
          points={points}
          accentClassName={widget.accent ? accentText : undefined}
        />
      );
    }
    case "walletTicker": {
      const wallet = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (!wallet) return <StatWidget label="Wallet ticker" value="—" sublabel="No wallets yet" />;
      const points = Array.from({ length: 14 }, (_, i) => {
        const key = daysAgoKey(13 - i);
        const spentUpTo = sum(expenses.filter((e) => e.type === "expense" && e.walletName === wallet.name && e.date <= key));
        const earnedUpTo = sum(expenses.filter((e) => e.type === "income" && e.walletName === wallet.name && e.date <= key));
        return wallet.balance - earnedUpTo + spentUpTo;
      });
      const first = points[0] ?? wallet.balance;
      const deltaPct = first !== 0 ? ((wallet.balance - first) / Math.abs(first)) * 100 : 0;
      return (
        <TickerCardWidget
          icon={<TickerIcon />}
          name={wallet.name}
          value={formatCurrency(wallet.balance, currency)}
          deltaLabel={`${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`}
          deltaPositive={deltaPct >= 0}
          points={points}
          accentClassName={widget.accent ? accentText : undefined}
        />
      );
    }
    case "todayPill":
      return (
        <PillStatWidget
          icon={<PillIcon />}
          label="Today's spending"
          value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date === today)), currency)}
          iconBgClassName={`${widget.accent ? accentBg : "bg-rose-500"} text-white`}
        />
      );
    case "pacePill": {
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const expectedPct = (dayOfMonth / daysInMonth) * 100;
      const lastMonthSpent = sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey));
      const pacePct = lastMonthSpent > 0 ? (monthSpent / lastMonthSpent) * 100 : expectedPct;
      return (
        <AlertPillWidget
          icon={<PillIcon />}
          title="Spending pace"
          subtitle={pacePct > expectedPct + 5 ? "Ahead of last month" : pacePct < expectedPct - 5 ? "Behind last month" : "On pace"}
          percent={pacePct}
          ringClassName={pacePct > expectedPct + 5 ? "text-red-400" : "text-emerald-400"}
        />
      );
    }
    case "noSpendDays": {
      const days = Array.from({ length: 7 }, (_, i) => {
        const key = toKeyOffsetFromWeekStart(weekStart, i);
        const spent = sum(expenses.filter((e) => e.type === "expense" && e.date === key));
        return { label: weekdayLabel(key), hit: spent === 0 && key <= today, display: spent === 0 ? "✓" : "·" };
      });
      const count = days.filter((d) => d.hit).length;
      return (
        <WeekdayTrackerWidget
          value={`${count}/7`}
          label="No-spend days this week"
          days={days}
          cardClassName={`${widget.accent ? accentBg : "bg-rose-500"} text-white`}
        />
      );
    }
    case "balanceHero": {
      const last = [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      return (
        <BalanceHeroWidget
          balance={formatCurrency(remaining, currency)}
          wallets={wallets.map((w) => ({ id: w.id, name: w.name, color: w.color }))}
          lastTransaction={
            last
              ? {
                  label: last.merchant,
                  date: last.date,
                  value: `${last.type === "expense" ? "-" : "+"}${formatCurrency(last.amount, currency)}`,
                }
              : null
          }
          onAddIncome={onAddIncome ?? noop}
          onAddExpense={onAddExpense ?? noop}
        />
      );
    }
    case "payPeriodStepper": {
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const pct = (dayOfMonth / daysInMonth) * 100;
      const activeIndex = pct < 33 ? 0 : pct < 66 ? 1 : 2;
      return (
        <StepperProgressWidget
          title="Month progress"
          subtitle={`Day ${dayOfMonth} of ${daysInMonth}`}
          stages={["Start", "Mid-month", "End"]}
          activeIndex={activeIndex}
          progressPercent={pct}
          accentClassName={widget.accent ? accentBg : "bg-surface-accent"}
        />
      );
    }
    case "spendingStreak": {
      const dayOfMonth = Number(today.slice(8, 10));
      const avgDaily = monthSpent / Math.max(1, dayOfMonth);
      const days = Array.from({ length: 7 }, (_, i) => {
        const key = toKeyOffsetFromWeekStart(weekStart, i);
        const spent = sum(expenses.filter((e) => e.type === "expense" && e.date === key));
        return { label: weekdayLabel(key), active: key <= today && spent <= avgDaily };
      });
      const streak = days.filter((d) => d.active).length;
      return (
        <CornerArrowStatWidget
          value={`${streak} days`}
          label="Under-average spending this week"
          bars={days}
          cardClassName={`${widget.accent ? accentBg : "bg-rose-500"} text-white`}
        />
      );
    }

    // ---- Budgets & goals ----
    case "budgetOverview": {
      const items = budgets.map((b, i) => {
        const limit = computeEffectiveBudgetLimit(expenses, b, currentMonthKey);
        const spentAmount = sum(monthExpenses.filter((e) => e.category === b.category));
        return {
          category: b.category,
          spent: spentAmount,
          limit,
          displaySpent: formatCurrency(spentAmount, currency),
          displayLimit: formatCurrency(limit, currency),
          colorClassName: accentBgClasses(colorFor(i)),
        };
      });
      return <BudgetOverviewWidget items={items} />;
    }
    case "savingsGoals": {
      const items = savingsGoals.map((g) => ({
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
        displayCurrent: formatCurrency(g.currentAmount, currency),
        displayTarget: formatCurrency(g.targetAmount, currency),
        colorClassName: accentBgClasses(g.color),
      }));
      return <SavingsGoalsWidget items={items} />;
    }

    default:
      return null;
  }
}
