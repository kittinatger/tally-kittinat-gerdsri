"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signedAmount, type Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { TransactionType } from "@/lib/categories";
import type { WalletOption } from "@/types/wallet";
import type { Budget } from "@/types/budget";
import type { SavingsGoal } from "@/types/savings-goal";
import type { RecurringRuleRow } from "@/lib/db";
import {
  resolveAnalyticsPeriod,
  computePeriodOverview,
  bucketExpensesByPeriod,
  reconstructNetWorthHistory,
  budgetsForThisMonth,
  projectedMonthEndSpend,
  upcomingRecurring,
  type AnalyticsPeriodId,
} from "@/lib/analytics";
import type { AnalyticsPrefs, AnalyticsSectionId } from "@/lib/analytics-prefs";
import { useT } from "@/lib/language-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";
import PullToRefresh from "./PullToRefresh";
import BudgetAlerts from "./BudgetAlerts";
import AppHeader from "./AppHeader";
import PeriodSelector from "./analytics/PeriodSelector";
import CustomizeSectionsMenu from "./analytics/CustomizeSectionsMenu";
import OverviewStrip from "./analytics/OverviewStrip";
import TrendSection from "./analytics/TrendSection";
import CategoryOverview from "./CategoryOverview";
import NetWorthWalletsSection from "./analytics/NetWorthWalletsSection";
import BudgetsGoalsSection from "./analytics/BudgetsGoalsSection";
import ForwardLookingSection from "./analytics/ForwardLookingSection";

const EditBalanceModal = dynamic(() => import("./EditBalanceModal"), { ssr: false });
const AddExpenseModal = dynamic(() => import("./AddExpenseModal"), { ssr: false });

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Replaces the old customizable widget-grid Dashboard — a fixed set of 6
// analytics sections (Overview, Spending trend, Categories, Net worth &
// wallets, Budgets & goals, Forward-looking) driven by one shared period
// selector, with only section visibility as a lightweight customization
// (see analytics-prefs.ts) rather than the old per-widget picker/
// drag-reorder system.
export default function AnalyticsPage({
  initialExpenses,
  initialRemaining,
  convertedNetWorth,
  categories,
  currency,
  wallets,
  budgets: initialBudgets,
  savingsGoals,
  recurringRules,
  initialPrefs,
  initialAddType = null,
}: {
  initialExpenses: Expense[];
  initialRemaining: number;
  convertedNetWorth: number;
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringRules: RecurringRuleRow[];
  initialPrefs: AnalyticsPrefs;
  initialAddType?: TransactionType | null;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>(initialPrefs.defaultPeriod);
  const [hiddenSections, setHiddenSections] = useState<AnalyticsSectionId[]>(initialPrefs.hiddenSections);
  const [editingBalance, setEditingBalance] = useState(false);
  const [addingType, setAddingType] = useState<TransactionType | null>(initialAddType);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!initialAddType) return;
    router.replace("/analytics", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  function handleBudgetDismissed(updated: Budget) {
    setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function handleBalanceSaved(value: number) {
    setRemaining(value);
    setEditingBalance(false);
  }

  function handleExpenseCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
    setRemaining((prev) => prev + signedAmount(expense));
    setAddingType(null);
  }

  function savePrefs(patch: Partial<AnalyticsPrefs>) {
    mutateFetch("/api/analytics-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {
      // Non-critical — the page still works with the in-memory choice.
    });
  }

  function handlePeriodChange(id: AnalyticsPeriodId) {
    setPeriodId(id);
    savePrefs({ defaultPeriod: id });
  }

  function handleToggleSection(id: AnalyticsSectionId) {
    setHiddenSections((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      savePrefs({ hiddenSections: next });
      return next;
    });
  }

  const today = todayIso();
  const period = resolveAnalyticsPeriod(periodId);
  const overview = computePeriodOverview(expenses, period);
  const expenseTrendPoints = bucketExpensesByPeriod(expenses, period, "expense");
  const incomeTrendPoints = bucketExpensesByPeriod(expenses, period, "income");
  const netWorthHistory = reconstructNetWorthHistory(expenses, convertedNetWorth, period, today);
  const budgetProgress = budgetsForThisMonth(budgets, expenses, today);
  const projected = projectedMonthEndSpend(expenses, today);
  const upcoming = upcomingRecurring(recurringRules, today);

  const show = (id: AnalyticsSectionId) => !hiddenSections.includes(id);

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
        <CurrencyProvider currency={currency}>
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
            <PullToRefresh>
              <AppHeader onAddClick={() => setAddingType("expense")} />

              <main className="flex-1 space-y-8 px-1 py-6 sm:px-2">
                <BudgetAlerts expenses={expenses} budgets={budgets} onDismissed={handleBudgetDismissed} />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="font-display text-xl text-foreground">{t("analytics.title")}</h1>
                  <div className="flex items-center gap-2">
                    <PeriodSelector value={periodId} onChange={handlePeriodChange} />
                    <CustomizeSectionsMenu hiddenSections={hiddenSections} onToggle={handleToggleSection} />
                  </div>
                </div>

                {show("overview") && (
                  <OverviewStrip netWorth={convertedNetWorth} overview={overview} onEditBalance={() => setEditingBalance(true)} />
                )}
                {show("trend") && <TrendSection expensePoints={expenseTrendPoints} incomePoints={incomeTrendPoints} />}
                {show("categories") && (
                  <div>
                    <h2 className="mb-3 font-display text-lg text-foreground">{t("analytics.sectionCategories")}</h2>
                    <CategoryOverview expenses={expenses} categories={categories} />
                  </div>
                )}
                {show("netWorth") && <NetWorthWalletsSection netWorthHistory={netWorthHistory} wallets={wallets} />}
                {show("budgets") && <BudgetsGoalsSection budgetProgress={budgetProgress} savingsGoals={savingsGoals} categories={categories} />}
                {show("forward") && <ForwardLookingSection projected={projected} upcoming={upcoming} />}
              </main>
            </PullToRefresh>

            {editingBalance && (
              <EditBalanceModal currentValue={remaining} onClose={() => setEditingBalance(false)} onSaved={handleBalanceSaved} />
            )}

            {addingType && <AddExpenseModal initialType={addingType} onClose={() => setAddingType(null)} onCreated={handleExpenseCreated} />}
          </div>
        </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
