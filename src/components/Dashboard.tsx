"use client";

import { useState } from "react";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import { CategoriesProvider } from "@/lib/categories-context";
import { CurrencyProvider } from "@/lib/currency-context";
import PullToRefresh from "./PullToRefresh";
import SummaryCards from "./SummaryCards";
import CategoryOverview from "./CategoryOverview";
import EditBalanceModal from "./EditBalanceModal";
import AppHeader from "./AppHeader";

export default function Dashboard({
  initialExpenses,
  initialRemaining,
  categories,
  currency,
}: {
  initialExpenses: Expense[];
  initialRemaining: number;
  categories: CategoryOption[];
  currency: string;
}) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [editingBalance, setEditingBalance] = useState(false);

  function handleBalanceSaved(value: number) {
    setRemaining(value);
    setEditingBalance(false);
  }

  return (
    <CategoriesProvider categories={categories}>
      <CurrencyProvider currency={currency}>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
          <PullToRefresh>
            <AppHeader />

            <main className="flex-1 px-1 py-6 sm:px-2">
              <SummaryCards
                expenses={initialExpenses}
                remaining={remaining}
                onEditBalance={() => setEditingBalance(true)}
              />
              <div className="mt-8">
                <CategoryOverview expenses={initialExpenses} categories={categories} />
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
        </div>
      </CurrencyProvider>
    </CategoriesProvider>
  );
}
