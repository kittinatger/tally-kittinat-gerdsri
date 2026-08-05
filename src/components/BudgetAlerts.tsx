"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/types/expense";
import type { Budget } from "@/types/budget";
import { monthKey, todayInputValue, formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";

export default function BudgetAlerts({ expenses, budgets }: { expenses: Expense[]; budgets: Budget[] }) {
  const currency = useCurrency();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => {
    const currentMonthKey = monthKey(todayInputValue());
    return budgets
      .map((b) => {
        const spent = expenses
          .filter((e) => e.type === "expense" && e.category === b.category && monthKey(e.date) === currentMonthKey)
          .reduce((sum, e) => sum + e.amount, 0);
        const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        return { budget: b, spent, percent };
      })
      .filter((a) => a.percent >= 90 && !dismissed.has(a.budget.id))
      .sort((a, b) => b.percent - a.percent);
  }, [expenses, budgets, dismissed]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {alerts.map(({ budget, spent, percent }) => {
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
              {formatCurrency(budget.monthlyLimit, currency)} ({percent.toFixed(0)}%)
            </p>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(budget.id))}
              aria-label="Dismiss"
              className={`shrink-0 rounded-full p-1 transition hover:bg-black/5 dark:hover:bg-white/10 ${
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
