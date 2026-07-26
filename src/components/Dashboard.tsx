"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense } from "@/types/expense";
import SummaryCards from "./SummaryCards";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";

function sortByDateDesc(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
}

export default function Dashboard({ initialExpenses }: { initialExpenses: Expense[] }) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function handleCreated(expense: Expense) {
    setExpenses((prev) => [expense, ...prev].sort(sortByDateDesc));
    setAddOpen(false);
  }

  function handleUpdated(expense: Expense) {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)).sort(sortByDateDesc));
    setEditing(null);
  }

  function handleDeleted(id: number) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-24 sm:pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/90 px-4 py-4 backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            T
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tally</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 sm:flex"
          >
            + Add expense
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 sm:px-6">
        <SummaryCards expenses={expenses} />
        <ExpenseList expenses={expenses} onSelect={setEditing} />
      </main>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-light text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 sm:hidden"
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
    </div>
  );
}
