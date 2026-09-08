"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { dotClasses, accentBgClasses } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import type { BudgetProgress } from "@/lib/analytics";
import type { SavingsGoal } from "@/types/savings-goal";
import type { CategoryOption } from "@/types/category";
import BudgetOverviewWidget, { type BudgetItem } from "../BudgetOverviewWidget";
import SavingsGoalsWidget, { type SavingsGoalItem } from "../SavingsGoalsWidget";

export default function BudgetsGoalsSection({
  budgetProgress,
  savingsGoals,
  categories,
}: {
  budgetProgress: BudgetProgress[];
  savingsGoals: SavingsGoal[];
  categories: CategoryOption[];
}) {
  const currency = useCurrency();

  const budgetItems: BudgetItem[] = budgetProgress.map((b, i) => {
    const category = categories.find((c) => c.name === b.category);
    return {
      category: b.category,
      spent: b.spent,
      limit: b.limit,
      displaySpent: formatCurrency(b.spent, currency),
      displayLimit: formatCurrency(b.limit, currency),
      colorClassName: category ? dotClasses(category.color) : accentBgClasses(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]),
    };
  });

  const goalItems: SavingsGoalItem[] = savingsGoals.map((g) => ({
    name: g.name,
    current: g.currentAmount,
    target: g.targetAmount,
    displayCurrent: formatCurrency(g.currentAmount, currency),
    displayTarget: formatCurrency(g.targetAmount, currency),
    colorClassName: dotClasses(g.color),
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-foreground">Budgets &amp; goals</h2>
          <p className="text-xs text-ink-soft">This month&apos;s budgets and your savings goals, at a glance.</p>
        </div>
        <Link href="/settings?panel=budgets" className="shrink-0 text-xs font-semibold text-navy hover:underline dark:text-blue-300">
          Manage
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetOverviewWidget items={budgetItems} />
        <SavingsGoalsWidget items={goalItems} />
      </div>
    </div>
  );
}
