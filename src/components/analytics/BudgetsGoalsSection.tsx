"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { dotClasses, accentBgClasses } from "@/lib/category-styles";
import { CATEGORY_PALETTE } from "@/lib/categories";
import type { BudgetProgress } from "@/lib/analytics";
import type { SavingsGoal } from "@/types/savings-goal";
import type { CategoryOption } from "@/types/category";
import BudgetOverviewWidget, { type BudgetItem } from "../BudgetOverviewWidget";
import SavingsGoalsWidget, { type SavingsGoalItem } from "../SavingsGoalsWidget";
import SectionHeader from "./SectionHeader";

function BudgetsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 10 13 7" />
    </svg>
  );
}

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
  const t = useT();

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
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<BudgetsIcon className="h-4 w-4" />}
        title={t("analytics.sectionBudgets")}
        description={t("analytics.budgetsGoalsDesc")}
        action={
          <Link href="/settings?panel=budgets" className="shrink-0 text-xs font-semibold text-navy hover:underline dark:text-blue-300">
            {t("analytics.manage")}
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetOverviewWidget items={budgetItems} delayMs={0} />
        <SavingsGoalsWidget items={goalItems} delayMs={80} />
      </div>
    </div>
  );
}
