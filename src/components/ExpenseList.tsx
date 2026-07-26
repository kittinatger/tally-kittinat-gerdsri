"use client";

import { useMemo } from "react";
import type { Expense } from "@/types/expense";
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
        <p className="font-display text-lg text-foreground">No expenses yet</p>
        <p className="text-sm text-ink-soft">Add one manually or scan a receipt to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, items]) => {
        const total = items.reduce((sum, e) => sum + e.amount, 0);
        return (
          <section key={key}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink-soft">{monthLabel(key)}</h2>
              <span className="text-sm text-ink-soft">{formatCurrency(total)}</span>
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
