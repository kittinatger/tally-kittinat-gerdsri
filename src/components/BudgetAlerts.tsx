"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import type { Budget } from "@/types/budget";
import { monthKey, todayInputValue, formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { computeEffectiveBudgetLimit } from "@/lib/budget-rollover";

export default function BudgetAlerts({
  expenses,
  budgets,
  onDismissed,
}: {
  expenses: Expense[];
  budgets: Budget[];
  onDismissed: (budget: Budget) => void;
}) {
  const currency = useCurrency();
  const [dismissing, setDismissing] = useState<number | null>(null);
  const currentMonthKey = monthKey(todayInputValue());

  const alerts = useMemo(() => {
    return budgets
      .map((b) => {
        const limit = computeEffectiveBudgetLimit(expenses, b, currentMonthKey);
        const spent = expenses
          .filter((e) => e.type === "expense" && e.category === b.category && monthKey(e.date) === currentMonthKey)
          .reduce((sum, e) => sum + e.amount, 0);
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        return { budget: b, spent, limit, percent };
      })
      .filter((a) => a.percent >= 90 && a.budget.dismissedAlertMonth !== currentMonthKey)
      .sort((a, b) => b.percent - a.percent);
  }, [expenses, budgets, currentMonthKey]);

  async function handleDismiss(budgetId: number) {
    setDismissing(budgetId);
    try {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissAlertForMonth: currentMonthKey }),
      });
      const data = await res.json();
      if (res.ok) onDismissed(data.budget);
    } finally {
      setDismissing(null);
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {alerts.map(({ budget, spent, limit, percent }) => {
        const over = percent >= 100;
        return (
          <div
            key={budget.id}
            className={`flex items-center justify-between gap-3 rounded-card border px-4 py-3 ${
              over
                ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/15"
                : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/15"
            }`}
          >
            <p className={`text-sm font-medium ${over ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
              {over ? "Over budget: " : "Near budget limit: "}
              <span className="font-semibold">{budget.category}</span> — {formatCurrency(spent, currency)} of{" "}
              {formatCurrency(limit, currency)} ({percent.toFixed(0)}%)
            </p>
            <button
              onClick={() => handleDismiss(budget.id)}
              disabled={dismissing === budget.id}
              aria-label="Dismiss"
              className={`shrink-0 rounded-full p-1 transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10 ${
                over ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"
              }`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
