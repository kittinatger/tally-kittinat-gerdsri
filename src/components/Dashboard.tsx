"use client";

import { useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import SummaryCards from "./SummaryCards";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import EditBalanceModal from "./EditBalanceModal";
import AppHeader from "./AppHeader";

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

export default function Dashboard({
  initialExpenses,
  initialRemaining,
}: {
  initialExpenses: Expense[];
  initialRemaining: number;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editingBalance, setEditingBalance] = useState(false);

  function handleCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
    setRemaining((prev) => prev + signedAmount(expense));
  }

  function handleUpdated(expense: Expense) {
    const previous = expenses.find((e) => e.id === expense.id);
    if (previous) {
      setRemaining((r) => r - signedAmount(previous) + signedAmount(expense));
    }
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)).sort(sortByDateDesc));
    setEditing(null);
  }

  function handleDeleted(id: number) {
    const removed = expenses.find((e) => e.id === id);
    if (removed) {
      setRemaining((r) => r - signedAmount(removed));
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
  }

  function handleBalanceSaved(value: number) {
    setRemaining(value);
    setEditingBalance(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-24 pt-3 sm:px-4 sm:pb-10">
      <AppHeader onAddClick={() => setAddOpen(true)} />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <SummaryCards expenses={expenses} remaining={remaining} onEditBalance={() => setEditingBalance(true)} />
        <ExpenseList expenses={expenses} onSelect={setEditing} />
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--fab-glass-border)] bg-[image:var(--fab-glass-bg)] text-2xl font-light text-white shadow-[var(--shadow-soft),var(--fab-glass-shadow)] backdrop-blur-xl transition hover:brightness-110 sm:hidden"
        aria-label="Add expense"
      >
        +
      </button>

      {addOpen && <AddExpenseModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}
      {editing && (
        <EditExpenseModal
          expense={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
      {editingBalance && (
        <EditBalanceModal
          currentValue={remaining}
          onClose={() => setEditingBalance(false)}
          onSaved={handleBalanceSaved}
        />
      )}
    </div>
  );
}
