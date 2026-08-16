"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { Budget } from "@/types/budget";
import type { SavingsGoal } from "@/types/savings-goal";
import type { DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import { WIDGET_ACCENTS } from "@/lib/dashboard-widgets";
import { useT } from "@/lib/language-context";
import { computeEffectiveBudgetLimit } from "@/lib/budget-rollover";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { accentTextClasses, accentBgClasses, heroGradientClasses } from "@/lib/category-styles";
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
  const t = useT();

  const today = todayInputValue();
  const currentMonthKey = monthKey(today);
  const lastMonthKey = monthsAgoKey(1);
  const weekStart = startOfWeekKey();
  const lastWeekStart = toKeyOffsetFromWeekStart(weekStart, -7);
  const lastWeekEnd = weekStart;
  const thisYear = today.slice(0, 4);
  const lastYear = String(Number(thisYear) - 1);

  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);
  const monthExpenses = thisMonth.filter((e) => e.type === "expense");
  const monthIncomeItems = thisMonth.filter((e) => e.type === "income");
  const monthIncome = sum(monthIncomeItems);
  const monthSpent = sum(monthExpenses);
  const accentText = accentTextClasses(widget.accent);
  const accentBg = accentBgClasses(widget.accent);
  const heroGradient = widget.accent ? heroGradientClasses(widget.accent) : "bg-gradient-to-br from-rose-400 to-rose-600";

  switch (widget.type) {
    case "welcome": {
      const scopedWallet = widget.walletId != null ? wallets.find((w) => w.id === widget.walletId) : undefined;
      return (
        <WelcomeWidget
          username={username ?? t("dashboardWidgetContent.there")}
          remaining={scopedWallet ? scopedWallet.balance : remaining}
          balanceLabel={scopedWallet ? scopedWallet.name : t("dashboardWidgetContent.allAccountsTotalBalance")}
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
          label={t("summaryCard.income")}
          value={formatCurrency(monthIncome, currency)}
          currencyCode={currency}
          onClick={widget.hideAction ? undefined : (onAddIncome ?? noop)}
        />
      );
    case "expensesCard":
      return (
        <ExpenseStatCard
          label={t("summaryCard.expenses")}
          value={formatCurrency(monthSpent, currency)}
          currencyCode={currency}
          onClick={widget.hideAction ? undefined : (onAddExpense ?? noop)}
        />
      );
    case "remainingCard":
      return (
        <BalanceStatCard
          label={t("summaryCard.remaining")}
          value={`${remaining < 0 ? "-" : ""}${formatCurrency(Math.abs(remaining), currency)}`}
          currencyCode={currency}
          negative={remaining < 0}
          onClick={widget.hideAction ? undefined : (onEditBalance ?? noop)}
        />
      );

    // ---- Big numbers ----
    case "todaySpending":
      return <ExpenseStatCard label={t("widget.todaySpendingTitle")} value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date === today)), currency)} />;
    case "yesterdaySpending": {
      const y = daysAgoKey(1);
      return <ExpenseStatCard label={t("widget.yesterdaySpendingTitle")} value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date === y)), currency)} />;
    }
    case "weekSpending":
      return <ExpenseStatCard label={t("widget.weekSpendingTitle")} value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date >= weekStart)), currency)} />;
    case "monthSpending":
      return <ExpenseStatCard label={t("widget.monthSpendingTitle")} value={formatCurrency(monthSpent, currency)} />;
    case "yearSpending":
      return (
        <ExpenseStatCard
          label={t("widget.yearSpendingTitle")}
          value={formatCurrency(sum(expenses.filter((e) => e.type === "expense" && e.date.startsWith(thisYear))), currency)}
        />
      );
    case "todayIncome":
      return <IncomeStatCard label={t("widget.todayIncomeTitle")} value={formatCurrency(sum(expenses.filter((e) => e.type === "income" && e.date === today)), currency)} />;
    case "monthIncome":
      return <IncomeStatCard label={t("widget.monthIncomeTitle")} value={formatCurrency(monthIncome, currency)} />;
    case "yearIncome":
      return (
        <IncomeStatCard
          label={t("widget.yearIncomeTitle")}
          value={formatCurrency(sum(expenses.filter((e) => e.type === "income" && e.date.startsWith(thisYear))), currency)}
        />
      );
    case "netWorth":
      return (
        <WalletStatCard
          label={t("widget.netWorthTitle")}
          value={formatCurrency(convertedNetWorth ?? remaining, currency)}
          sublabel={t("dashboardWidgetContent.allWalletsCombined")}
        />
      );
    case "totalBalance": {
      const total = wallets.reduce((s, w) => s + w.balance, 0);
      return (
        <WalletStatCard
          label={t("widget.totalBalanceTitle")}
          value={formatCurrency(total, currency)}
          sublabel={`${t("dashboardWidgetContent.across")} ${wallets.length} ${wallets.length === 1 ? t("dashboardWidgetContent.activeWallet") : t("dashboardWidgetContent.activeWallets")}`}
        />
      );
    }
    case "avgDailySpending": {
      const dayOfMonth = Number(today.slice(8, 10));
      return (
        <ExpenseStatCard
          label={t("widget.avgDailySpendingTitle")}
          value={formatCurrency(monthSpent / Math.max(1, dayOfMonth), currency)}
          sublabel={t("dashboardWidgetContent.thisMonth")}
        />
      );
    }
    case "avgTransactionAmount":
      return (
        <ExpenseStatCard
          label={t("widget.avgTransactionAmountTitle")}
          value={formatCurrency(monthExpenses.length > 0 ? monthSpent / monthExpenses.length : 0, currency)}
          sublabel={t("dashboardWidgetContent.thisMonth")}
        />
      );
    case "avgIncomeAmount":
      return (
        <IncomeStatCard
          label={t("widget.avgIncomeAmountTitle")}
          value={formatCurrency(monthIncomeItems.length > 0 ? monthIncome / monthIncomeItems.length : 0, currency)}
          sublabel={t("dashboardWidgetContent.thisMonth")}
        />
      );
    case "biggestExpense": {
      const biggest = monthExpenses.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);
      return (
        <ExpenseStatCard
          label={t("widget.biggestExpenseTitle")}
          value={biggest ? formatCurrency(biggest.amount, currency) : "—"}
          sublabel={biggest ? biggest.merchant : t("dashboardWidgetContent.noExpensesThisMonth")}
        />
      );
    }
    case "biggestIncome": {
      const biggest = monthIncomeItems.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);
      return (
        <IncomeStatCard
          label={t("widget.biggestIncomeTitle")}
          value={biggest ? formatCurrency(biggest.amount, currency) : "—"}
          sublabel={biggest ? biggest.merchant : t("dashboardWidgetContent.noIncomeThisMonth")}
        />
      );
    }
    case "transactionCount":
      return <StatWidget label={t("widget.transactionCountTitle")} value={String(thisMonth.length)} sublabel={t("dashboardWidgetContent.thisMonth")} valueClassName={accentText} />;
    case "transfersTotal":
      return (
        <StatWidget
          label={t("widget.transfersTotalTitle")}
          // Every transfer is stored as two rows (an "out" leg on the source
          // wallet and an "in" leg on the destination) — counting only one
          // side avoids double-counting the amount actually moved.
          value={formatCurrency(sum(thisMonth.filter((e) => e.type === "transfer" && e.direction === "out")), currency)}
          sublabel={t("dashboardWidgetContent.thisMonth")}
          valueClassName={accentText}
        />
      );
    case "walletCount":
      return <StatWidget label={t("widget.walletCountTitle")} value={String(wallets.length)} sublabel={t("dashboardWidgetContent.activeWalletsLabel")} valueClassName={accentText} />;
    case "categoryCount": {
      const distinct = new Set(thisMonth.map((e) => e.category));
      return <StatWidget label={t("widget.categoryCountTitle")} value={String(distinct.size)} sublabel={t("dashboardWidgetContent.thisMonth")} valueClassName={accentText} />;
    }
    case "tagCount": {
      const distinct = new Set(thisMonth.flatMap((e) => e.tags));
      return <StatWidget label={t("widget.tagCountTitle")} value={String(distinct.size)} sublabel={t("dashboardWidgetContent.thisMonth")} valueClassName={accentText} />;
    }

    // ---- Trend arrows ----
    case "monthComparison": {
      const lastMonthSpent = sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey));
      const pct = lastMonthSpent > 0 ? ((monthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
      return (
        <ExpenseStatCard
          label={t("widget.monthComparisonTitle")}
          value={formatCurrency(monthSpent, currency)}
          sublabel={`${t("dashboardWidgetContent.vs")} ${formatCurrency(lastMonthSpent, currency)} ${t("dashboardWidgetContent.lastMonth")}`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 1 }}
        />
      );
    }
    case "incomeComparison": {
      const lastMonthIncome = sum(expenses.filter((e) => e.type === "income" && monthKey(e.date) === lastMonthKey));
      const pct = lastMonthIncome > 0 ? ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      return (
        <IncomeStatCard
          label={t("widget.incomeComparisonTitle")}
          value={formatCurrency(monthIncome, currency)}
          sublabel={`${t("dashboardWidgetContent.vs")} ${formatCurrency(lastMonthIncome, currency)} ${t("dashboardWidgetContent.lastMonth")}`}
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
          label={t("widget.weekComparisonTitle")}
          value={formatCurrency(thisWeekSpent, currency)}
          sublabel={`${t("dashboardWidgetContent.vs")} ${formatCurrency(lastWeekSpent, currency)} ${t("dashboardWidgetContent.lastWeek")}`}
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
          label={t("widget.yearOverYearTitle")}
          value={formatCurrency(thisYearSpent, currency)}
          sublabel={`${t("dashboardWidgetContent.vs")} ${formatCurrency(lastYearSpent, currency)} ${t("dashboardWidgetContent.lastYear")}`}
          trend={{ label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 1 }}
        />
      );
    }

    // ---- Rings & gauges ----
    case "savingsRate": {
      const rate = monthIncome > 0 ? ((monthIncome - monthSpent) / monthIncome) * 100 : 0;
      return (
        <ProgressRingWidget
          label={t("widget.savingsRateTitle")}
          percent={rate}
          centerValue={monthIncome > 0 ? `${rate.toFixed(0)}%` : "—"}
          sublabel={t("dashboardWidgetContent.thisMonth")}
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
          label={t("widget.monthProgressTitle")}
          percent={pct}
          centerValue={`${t("dashboardWidgetContent.day")} ${dayOfMonth}`}
          sublabel={`${t("dashboardWidgetContent.of")} ${daysInMonth}`}
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
      return <ProgressRingWidget label={t("widget.yearProgressTitle")} percent={pct} centerValue={`${pct.toFixed(0)}%`} sublabel={thisYear} ringClassName={accentText} />;
    }
    case "spendPace": {
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const expectedPct = (dayOfMonth / daysInMonth) * 100;
      const lastMonthSpent = sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === lastMonthKey));
      const pacePct = lastMonthSpent > 0 ? (monthSpent / lastMonthSpent) * 100 : expectedPct;
      return (
        <GaugeWidget
          label={t("widget.spendPaceTitle")}
          percent={pacePct}
          sublabel={
            pacePct > expectedPct + 5
              ? t("dashboardWidgetContent.aheadOfPace")
              : pacePct < expectedPct - 5
                ? t("dashboardWidgetContent.behindPace")
                : t("dashboardWidgetContent.onPace")
          }
          needleClassName={widget.accent ? accentText : "text-rose-500 dark:text-rose-400"}
        />
      );
    }
    case "walletUsage": {
      const wallet = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (!wallet) return <StatWidget label={t("widget.walletUsageTitle")} value="—" sublabel={t("dashboardWidgetContent.noWalletsYet")} />;
      const totalBalance = wallets.reduce((s, w) => s + Math.max(w.balance, 0), 0);
      const share = totalBalance > 0 ? (Math.max(wallet.balance, 0) / totalBalance) * 100 : 0;
      return (
        <GaugeWidget
          label={`${wallet.name} ${t("dashboardWidgetContent.share")}`}
          percent={share}
          sublabel={formatCurrency(wallet.balance, currency)}
          needleClassName={widget.accent ? accentText : "text-sky-500 dark:text-sky-400"}
        />
      );
    }

    // ---- Sparklines ----
    case "last14DaysSpark": {
      const points = Array.from({ length: 14 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(13 - i))));
      return <ExpenseAreaSparkWidget label={t("widget.last14DaysSparkTitle")} value={formatCurrency(points.reduce((a, b) => a + b, 0), currency)} points={points} />;
    }
    case "last14DaysIncomeSpark": {
      const points = Array.from({ length: 14 }, (_, i) => sum(expenses.filter((e) => e.type === "income" && e.date === daysAgoKey(13 - i))));
      return <IncomeAreaSparkWidget label={t("widget.last14DaysIncomeSparkTitle")} value={formatCurrency(points.reduce((a, b) => a + b, 0), currency)} points={points} />;
    }
    case "last6MonthsSpark": {
      const points = Array.from({ length: 6 }, (_, i) => {
        const mk = monthsAgoKey(5 - i);
        return sum(expenses.filter((e) => e.type === "expense" && monthKey(e.date) === mk));
      });
      return <ExpenseAreaSparkWidget label={t("widget.last6MonthsSparkTitle")} value={formatCurrency(monthSpent, currency)} points={points} />;
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
      return <DonutChartWidget title={t("widget.categoryDonutTitle")} segments={segments} />;
    }
    case "typeDonut": {
      // Each transfer is stored as two rows (out leg + in leg) — counting
      // both would make "Transfer" look twice as common as it actually is
      // relative to Expense/Income, which each have exactly one row per
      // transaction.
      const countOf = (ty: "expense" | "income" | "transfer") =>
        ty === "transfer" ? thisMonth.filter((e) => e.type === ty && e.direction === "out").length : thisMonth.filter((e) => e.type === ty).length;
      const segments = (["expense", "income", "transfer"] as const).map((ty, i) => ({
        label: ty === "expense" ? t("dashboardWidgetContent.expenseType") : ty === "income" ? t("dashboardWidgetContent.incomeType") : t("dashboardWidgetContent.transferType"),
        value: countOf(ty),
        displayValue: String(countOf(ty)),
        colorClassName: accentTextClasses(colorFor(i)),
      }));
      return <DonutChartWidget title={t("widget.typeDonutTitle")} segments={segments} />;
    }
    case "walletDonut": {
      const segments = wallets.map((w, i) => ({
        label: w.name,
        value: Math.max(w.balance, 0),
        displayValue: formatCurrency(w.balance, currency),
        colorClassName: accentTextClasses(colorFor(i)),
      }));
      return <DonutChartWidget title={t("widget.walletDonutTitle")} segments={segments} />;
    }

    // ---- Heatmaps ----
    case "last30DaysHeatmap": {
      const values = Array.from({ length: 30 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(29 - i))));
      const max = Math.max(...values, 1);
      const cells = values.map((v, i) => ({ date: daysAgoKey(29 - i), intensity: v / max }));
      return <HeatmapWidget title={t("widget.last30DaysHeatmapTitle")} cells={cells} colorClassName={widget.accent ? accentBg : "bg-rose-500"} />;
    }
    case "last90DaysHeatmap": {
      const values = Array.from({ length: 90 }, (_, i) => sum(expenses.filter((e) => e.type === "expense" && e.date === daysAgoKey(89 - i))));
      const max = Math.max(...values, 1);
      const cells = values.map((v, i) => ({ date: daysAgoKey(89 - i), intensity: v / max }));
      return <HeatmapWidget title={t("widget.last90DaysHeatmapTitle")} cells={cells} colorClassName={widget.accent ? accentBg : "bg-rose-500"} />;
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
      return total > 0 ? (
        <StackedBarWidget title={t("dashboardWidgetContent.walletShareTitle")} segments={segments} />
      ) : (
        <StackedBarWidget title={t("dashboardWidgetContent.walletShareTitle")} segments={[]} />
      );
    }
    case "categoryShareBar": {
      const entries = [...groupSum(monthExpenses, (e) => e.category).entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const segments = entries.map(([label, value], i) => ({
        label,
        value,
        displayValue: formatCurrency(value, currency),
        colorClassName: accentBgClasses(colorFor(i)),
      }));
      return <StackedBarWidget title={t("dashboardWidgetContent.categoryShareTitle")} segments={segments} />;
    }

    // ---- Comparison bars ----
    case "incomeVsExpenseBars":
      return (
        <ComparisonBarsWidget
          title={t("widget.incomeVsExpenseBarsTitle")}
          barA={{ label: t("summaryCard.income"), value: monthIncome, displayValue: formatCurrency(monthIncome, currency), colorClassName: "bg-emerald-500" }}
          barB={{ label: t("summaryCard.expenses"), value: monthSpent, displayValue: formatCurrency(monthSpent, currency), colorClassName: "bg-red-500" }}
        />
      );
    case "cashVsDigitalBars": {
      const cash = wallets.filter((w) => w.kind === "cash").reduce((s, w) => s + w.balance, 0);
      const digital = wallets.filter((w) => w.kind === "digital").reduce((s, w) => s + w.balance, 0);
      return (
        <ComparisonBarsWidget
          title={t("widget.cashVsDigitalBarsTitle")}
          barA={{ label: t("dashboardWidgetContent.cash"), value: Math.max(cash, 0), displayValue: formatCurrency(cash, currency), colorClassName: "bg-amber-500" }}
          barB={{ label: t("dashboardWidgetContent.digital"), value: Math.max(digital, 0), displayValue: formatCurrency(digital, currency), colorClassName: "bg-sky-500" }}
        />
      );
    }

    // ---- Ranked bar lists ----
    case "topCategories": {
      const items = [...groupSum(monthExpenses, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title={t("widget.topCategoriesTitle")} items={items} />;
    }
    case "topMerchants": {
      const items = [...groupSum(monthExpenses, (e) => e.merchant).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title={t("widget.topMerchantsTitle")} items={items} />;
    }
    case "topTags": {
      const counts = new Map<string, number>();
      for (const e of expenses) for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const items = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label: `#${label}`, value, displayValue: String(value), colorClassName: accentBgClasses(colorFor(i)) }));
      return <ExpenseRankedWidget title={t("widget.topTagsTitle")} items={items} />;
    }
    case "topIncomeSources": {
      const items = [...groupSum(monthIncomeItems, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 5)
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <IncomeSourcesRankedWidget title={t("widget.topIncomeSourcesTitle")} items={items} />;
    }
    case "walletDistribution": {
      const items = wallets.map((w, i) => ({ label: w.name, value: Math.max(w.balance, 0), displayValue: formatCurrency(w.balance, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <WalletRankedWidget title={t("widget.walletDistributionTitle")} items={items} />;
    }
    case "expensesByWallet": {
      const items = [...groupSum(monthExpenses, (e) => e.walletName ?? t("dashboardWidgetContent.unassigned")).entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, value], i) => ({ label, value, displayValue: formatCurrency(value, currency), colorClassName: accentBgClasses(colorFor(i)) }));
      return <WalletRankedWidget title={t("widget.expensesByWalletTitle")} items={items} />;
    }

    // ---- Leaderboards ----
    case "topMerchantsLeaderboard": {
      const items = [...groupSum(monthExpenses, (e) => e.merchant).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 3)
        .map(([label, value]) => ({ label, displayValue: formatCurrency(value, currency) }));
      return <ExpenseLeaderboardWidget title={t("widget.topMerchantsLeaderboardTitle")} items={items} />;
    }
    case "topCategoriesLeaderboard": {
      const items = [...groupSum(monthExpenses, (e) => e.category).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, widget.limit ?? 3)
        .map(([label, value]) => ({ label, displayValue: formatCurrency(value, currency) }));
      return <ExpenseLeaderboardWidget title={t("widget.topCategoriesLeaderboardTitle")} items={items} />;
    }

    // ---- Bar chart ----
    case "last7Days": {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const key = daysAgoKey(6 - i);
        return { label: weekdayLabel(key), value: sum(expenses.filter((e) => e.type === "expense" && e.date === key)) };
      });
      return <MiniBarChartWidget title={t("widget.last7DaysTitle")} bars={bars} barClassName={widget.accent ? accentBg : "bg-rose-500"} />;
    }

    // ---- Creative widgets ----
    case "netWorthTicker": {
      const points = Array.from({ length: 14 }, (_, i) => {
        const key = daysAgoKey(13 - i);
        const spentAfter = sum(expenses.filter((e) => e.type === "expense" && e.date > key));
        const earnedAfter = sum(expenses.filter((e) => e.type === "income" && e.date > key));
        return remaining - earnedAfter + spentAfter;
      });
      const first = points[0] ?? remaining;
      const deltaPct = first !== 0 ? ((remaining - first) / Math.abs(first)) * 100 : 0;
      return (
        <TickerCardWidget
          icon={<TickerIcon />}
          name={t("widget.netWorthTitle")}
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
      if (!wallet) return <StatWidget label={t("widget.walletTickerTitle")} value="—" sublabel={t("dashboardWidgetContent.noWalletsYet")} />;
      const points = Array.from({ length: 14 }, (_, i) => {
        const key = daysAgoKey(13 - i);
        // A transfer leg moves this wallet's balance exactly like an
        // expense (direction "out") or income (direction "in") would —
        // omitting it here understated/flattened the reconstructed history
        // for any wallet that had a transfer in the last 14 days.
        const spentAfter = sum(
          expenses.filter(
            (e) =>
              e.walletName === wallet.name &&
              e.date > key &&
              (e.type === "expense" || (e.type === "transfer" && e.direction === "out")),
          ),
        );
        const earnedAfter = sum(
          expenses.filter(
            (e) =>
              e.walletName === wallet.name &&
              e.date > key &&
              (e.type === "income" || (e.type === "transfer" && e.direction === "in")),
          ),
        );
        return wallet.balance - earnedAfter + spentAfter;
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
          label={t("widget.todaySpendingTitle")}
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
          title={t("widget.spendPaceTitle")}
          subtitle={
            pacePct > expectedPct + 5
              ? t("dashboardWidgetContent.aheadLastMonth")
              : pacePct < expectedPct - 5
                ? t("dashboardWidgetContent.behindLastMonth")
                : t("dashboardWidgetContent.onPace")
          }
          percent={pacePct}
          ringClassName={pacePct > expectedPct + 5 ? "text-red-400" : "text-emerald-400"}
        />
      );
    }
    case "noSpendDays": {
      const days = Array.from({ length: 7 }, (_, i) => {
        const key = toKeyOffsetFromWeekStart(weekStart, i);
        const spent = sum(expenses.filter((e) => e.type === "expense" && e.date === key));
        return { label: weekdayLabel(key), hit: spent === 0 && key <= today };
      });
      const count = days.filter((d) => d.hit).length;
      return (
        <WeekdayTrackerWidget
          value={`${count}/7`}
          label={t("dashboardWidgetContent.noSpendDaysThisWeek")}
          days={days}
          cardClassName={`${heroGradient} text-white`}
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
          title={t("widget.monthProgressTitle")}
          subtitle={`${t("dashboardWidgetContent.day")} ${dayOfMonth} ${t("dashboardWidgetContent.of")} ${daysInMonth}`}
          stages={[t("dashboardWidgetContent.stageStart"), t("dashboardWidgetContent.stageMidMonth"), t("dashboardWidgetContent.stageEnd")]}
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
          label={t("dashboardWidgetContent.underAverageSpendingThisWeek")}
          bars={days}
          cardClassName={`${heroGradient} text-white`}
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
