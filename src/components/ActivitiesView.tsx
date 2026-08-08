"use client";

import { useState } from "react";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { WalletsProvider } from "@/lib/wallets-context";
import PullToRefresh from "./PullToRefresh";
import ExpenseList, { type TypeFilter } from "./ExpenseList";
import ActivitiesBalanceCard from "./ActivitiesBalanceCard";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import ExpenseDetailModal from "./ExpenseDetailModal";
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
  initialWalletFilter = "all",
}: {
  initialExpenses: Expense[];
  categories: CategoryOption[];
  currency: string;
  wallets: WalletOption[];
  /** Wallet name to scope the balance card/list to on load — from Settings
   * > Wallets' "Default wallet for Activities" setting. "all" means every
   * wallet. */
  initialWalletFilter?: string;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [walletFilter, setWalletFilter] = useState(initialWalletFilter);

  const activeWallets = wallets.filter((w) => !w.archived);

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

  function handleEditFromDetail() {
    setEditing(viewing);
    setViewing(null);
  }

  function handleBulkDeleted(ids: number[]) {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
  }

  function handleBulkUpdated(updated: Expense[]) {
    const byId = new Map(updated.map((e) => [e.id, e]));
    setExpenses((prev) => prev.map((e) => byId.get(e.id) ?? e));
  }

  return (
    <CategoriesProvider categories={categories}>
      <WalletsProvider wallets={wallets}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
          <PullToRefresh>
            <AppHeader onAddClick={() => setAddOpen(true)} />

            <main className="flex-1 px-1 py-6 sm:px-2">
              <ActivitiesBalanceCard
                wallets={activeWallets}
                currency={currency}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                walletFilter={walletFilter}
                onWalletFilterChange={setWalletFilter}
              />
              <ExpenseList
                expenses={expenses}
                onSelect={setViewing}
                onBulkDeleted={handleBulkDeleted}
                onBulkUpdated={handleBulkUpdated}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                walletFilter={walletFilter}
                onWalletFilterChange={setWalletFilter}
              />
            </main>
          </PullToRefresh>

          {addOpen && <AddExpenseModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}
          {viewing && (
            <ExpenseDetailModal expense={viewing} onClose={() => setViewing(null)} onEdit={handleEditFromDetail} />
          )}
          {editing && (
            <EditExpenseModal
              expense={editing}
              onClose={() => setEditing(null)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onDuplicated={handleCreated}
            />
          )}
        </div>
      </CurrencyProvider>
      </WalletsProvider>
    </CategoriesProvider>
  );
}
