"use client";

import { useState } from "react";
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
import EditBalanceModal from "./EditBalanceModal";
import AddExpenseModal from "./AddExpenseModal";
import AppHeader from "./AppHeader";

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
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  function handleBudgetDismissed(updated: Budget) {
    setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }
  const [editingBalance, setEditingBalance] = useState(false);
  const [addingType, setAddingType] = useState<TransactionType | null>(null);

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
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
          <PullToRefresh>
            <AppHeader onAddClick={() => setAddingType("expense")} />

            <main className="flex-1 px-1 py-6 sm:px-2">
              <BudgetAlerts expenses={expenses} budgets={budgets} onDismissed={handleBudgetDismissed} />
              <div className="grid grid-cols-4 gap-4">
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
