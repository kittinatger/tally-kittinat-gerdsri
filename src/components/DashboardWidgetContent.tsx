"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { DashboardWidgetType } from "@/lib/dashboard-widgets";
import SummaryCards from "./SummaryCards";
import CategoryOverview from "./CategoryOverview";
import WalletsWidget from "./WalletsWidget";
import RecentTransactionsWidget from "./RecentTransactionsWidget";

function noop() {}

// Renders the actual widget for a given type — shared between the live
// Dashboard and the Customize dashboard preview, so what you see while
// rearranging is exactly what you'll see afterward.
export default function DashboardWidgetContent({
  type,
  expenses,
  categories,
  remaining,
  onEditBalance,
  onAddIncome,
  onAddExpense,
}: {
  type: DashboardWidgetType;
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
  onEditBalance?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}) {
  switch (type) {
    case "summary":
      return (
        <SummaryCards
          expenses={expenses}
          remaining={remaining}
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
      return <RecentTransactionsWidget expenses={expenses} />;
    default:
      return null;
  }
}
