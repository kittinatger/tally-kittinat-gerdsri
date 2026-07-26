"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signedAmount, type Expense } from "@/types/expense";
import SummaryCards from "./SummaryCards";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import EditBalanceModal from "./EditBalanceModal";
import SettingsMenu from "./SettingsMenu";

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
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-24 pt-3 sm:px-4 sm:pb-10">
      <header className="sticky top-3 z-10 flex items-center justify-between gap-3 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-4 py-2.5 shadow-soft backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
            T
          </div>
          <h1 className="font-display text-lg text-foreground">Tally</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="hidden items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark hover:-translate-y-0.5 sm:flex"
          >
            + Add
          </button>
          <SettingsMenu />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-1 py-6 sm:px-2">
        <SummaryCards expenses={expenses} remaining={remaining} onEditBalance={() => setEditingBalance(true)} />
        <ExpenseList expenses={expenses} onSelect={setEditing} />
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-2xl font-light text-white shadow-soft transition hover:bg-navy-dark sm:hidden"
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
