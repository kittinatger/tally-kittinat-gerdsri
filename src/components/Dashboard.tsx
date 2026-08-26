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
import { WIDGET_WIDTH_COLSPAN, type DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import PullToRefresh from "./PullToRefresh";
import BudgetAlerts from "./BudgetAlerts";
import DashboardWidgetContent from "./DashboardWidgetContent";
import AppHeader from "./AppHeader";

// Both are only ever mounted after a click (edit balance / add transaction),
// never on first paint — loading their code on demand instead of bundling
// them into every Dashboard load noticeably shrinks its initial JS.
const EditBalanceModal = dynamic(() => import("./EditBalanceModal"), { ssr: false });
const AddExpenseModal = dynamic(() => import("./AddExpenseModal"), { ssr: false });

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

export default function Dashboard({
  initialExpenses,
  initialRemaining,
  convertedNetWorth,
  categories,
  currency,
  wallets,
  widgets,
  budgets: initialBudgets,
  savingsGoals,
  username,
  initialAddType = null,
}: {
  initialExpenses: Expense[];
  initialRemaining: number;
  /** Net worth with each wallet's non-default-currency balance converted, when the user opts in — display-only, never fed back into editing "Remaining". */
  convertedNetWorth: number;
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  widgets: DashboardWidgetInstance[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  username: string;
  /** Opens AddExpenseModal on mount — powers the PWA "Add expense" home-
   * screen shortcut (manifest.json -> shortcuts -> "/?add=expense"), read
   * server-side by page.tsx and passed down, same pattern as Settings'
   * `?panel=` deep link. */
  initialAddType?: TransactionType | null;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  function handleBudgetDismissed(updated: Budget) {
    setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }
  const [editingBalance, setEditingBalance] = useState(false);
  const [addingType, setAddingType] = useState<TransactionType | null>(initialAddType);
  const router = useRouter();

  // Strips the `?add=expense` param once consumed (replace, not push) so
  // it doesn't linger in history and reopen the modal on back/refresh.
  useEffect(() => {
    if (!initialAddType) return;
    router.replace("/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  function handleBalanceSaved(value: number) {
    setRemaining(value);
    setEditingBalance(false);
  }

  function handleExpenseCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
    setRemaining((prev) => prev + signedAmount(expense));
    setAddingType(null);
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
          <PullToRefresh>
            <AppHeader onAddClick={() => setAddingType("expense")} />

            <main className="flex-1 px-1 py-6 sm:px-2">
              <BudgetAlerts expenses={expenses} budgets={budgets} onDismissed={handleBudgetDismissed} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {widgets.map((w) => (
                  <div key={w.id} className={WIDGET_WIDTH_COLSPAN[w.width]}>
                    <DashboardWidgetContent
                      widget={w}
                      expenses={expenses}
                      categories={categories}
                      remaining={remaining}
                      convertedNetWorth={convertedNetWorth}
                      budgets={budgets}
                      savingsGoals={savingsGoals}
                      onEditBalance={() => setEditingBalance(true)}
                      onAddIncome={() => setAddingType("income")}
                      onAddExpense={() => setAddingType("expense")}
                      onAddTransfer={() => setAddingType("transfer")}
                      username={username}
                    />
                  </div>
                ))}
              </div>
            </main>
          </PullToRefresh>

          {editingBalance && (
            <EditBalanceModal
              currentValue={remaining}
              onClose={() => setEditingBalance(false)}
              onSaved={handleBalanceSaved}
            />
          )}

          {addingType && (
            <AddExpenseModal
              initialType={addingType}
              onClose={() => setAddingType(null)}
              onCreated={handleExpenseCreated}
            />
          )}
        </div>
      </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
