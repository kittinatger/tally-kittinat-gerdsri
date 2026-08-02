"use client";

import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import SummaryCards from "./SummaryCards";
import CategoryOverview from "./CategoryOverview";
import WalletsWidget from "./WalletsWidget";
import RecentTransactionsWidget from "./RecentTransactionsWidget";

function noop() {}

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
      return <RecentTransactionsWidget expenses={expenses} />;
    default:
      return null;
  }
}
