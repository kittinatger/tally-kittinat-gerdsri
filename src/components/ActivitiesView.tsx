"use client";

import { useState } from "react";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import PullToRefresh from "./PullToRefresh";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import AppHeader from "./AppHeader";

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

export default function ActivitiesView({
  initialExpenses,
  categories,
  currency,
  wallets,
}: {
  initialExpenses: Expense[];
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  function handleCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
  }

  function handleUpdated(expense: Expense) {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)).sort(sortByDateDesc));
    setEditing(null);
  }

  function handleDeleted(id: number) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
          <PullToRefresh>
            <AppHeader onAddClick={() => setAddOpen(true)} />

            <main className="flex-1 px-1 py-6 sm:px-2">
              <ExpenseList expenses={expenses} onSelect={setEditing} />
            </main>
          </PullToRefresh>

          {addOpen && <AddExpenseModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}
          {editing && (
            <EditExpenseModal
              expense={editing}
              onClose={() => setEditing(null)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          )}
        </div>
      </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
