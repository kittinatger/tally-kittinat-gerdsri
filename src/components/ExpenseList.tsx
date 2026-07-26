"use client";

import { useMemo } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { monthKey, monthLabel, formatCurrency } from "@/lib/format";
import ExpenseRow from "./ExpenseRow";

export default function ExpenseList({
  expenses,
  onSelect,
}: {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const key = monthKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <p className="text-4xl">🧾</p>
        <p className="font-display text-lg text-foreground">No transactions yet</p>
        <p className="text-sm text-ink-soft">Add an expense or income entry, or scan a document, to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, items]) => {
        const net = items.reduce((sum, e) => sum + signedAmount(e), 0);
        return (
          <section key={key}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink-soft">{monthLabel(key)}</h2>
              <span
                className={`text-sm font-semibold ${
                  net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {net >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(net))}
              </span>
            </div>
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              {items.map((expense, i) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onClick={() => onSelect(expense)}
                  isLast={i === items.length - 1}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
