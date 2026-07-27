"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, monthShortLabel, todayInputValue } from "@/lib/format";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import AppHeader from "./AppHeader";
import CategoryModal from "./CategoryModal";

type Range = "month" | "all";

export default function CategoriesView({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [range, setRange] = useState<Range>("month");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; category: CategoryOption } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type).sort((a, b) => a.id - b.id),
    [categories, type],
  );

  function colorFor(name: string): string | undefined {
    return categoriesForType.find((c) => c.name === name)?.color;
  }

  const breakdown = useMemo(() => {
    const currentMonthKey = monthKey(todayInputValue());
    const filtered = expenses.filter((e) => {
      if (e.type !== type) return false;
      if (range === "month" && monthKey(e.date) !== currentMonthKey) return false;
      return true;
    });

    const totals = new Map<string, number>();
    for (const e of filtered) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }

    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    const rows = Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { rows, total, count: filtered.length };
  }, [expenses, type, range]);

  const trend = useMemo(() => {
    const now = new Date(`${todayInputValue()}T00:00:00`);
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const totals = new Map(months.map((m) => [m, 0]));
    for (const e of expenses) {
      if (e.type !== type) continue;
      const key = monthKey(e.date);
      if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
    }
    const max = Math.max(...totals.values(), 0);
    return months.map((key) => ({ key, amount: totals.get(key) ?? 0, pct: max > 0 ? (totals.get(key)! / max) * 100 : 0 }));
  }, [expenses, type]);

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setDeleteError(null);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not delete that category.");
        setConfirmDeleteId(null);
        return;
      }
      router.refresh();
    } catch {
      setDeleteError("Network error while deleting.");
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-foreground">Categories</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              <button
                onClick={() => setType("expense")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  type === "expense" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setType("income")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  type === "income" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                Income
              </button>
            </div>
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              <button
                onClick={() => setRange("month")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  range === "month" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                This month
              </button>
              <button
                onClick={() => setRange("all")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  range === "all" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                }`}
              >
                All time
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Total {type === "income" ? "income" : "spent"}
          </p>
          <p
            className={`mt-1.5 font-display text-3xl ${
              type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            }`}
          >
            {formatCurrency(breakdown.total)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {breakdown.count} transaction{breakdown.count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mb-6 rounded-card border border-line bg-surface p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {type === "income" ? "Income" : "Spending"} trend
          </p>
          <div className="flex items-end justify-between gap-2">
            {trend.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-foreground">
                  {m.amount > 0 ? formatCurrency(m.amount) : ""}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      type === "income" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-navy"
                    }`}
                    style={{ height: `${Math.max(m.pct, m.amount > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-xs text-ink-soft">{monthShortLabel(m.key)}</span>
              </div>
            ))}
          </div>
        </div>

        {breakdown.rows.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-4xl">📊</p>
            <p className="font-display text-lg text-foreground">No data yet</p>
            <p className="text-sm text-ink-soft">
              {type === "income" ? "Income" : "Expenses"} for this range will show up here once you&apos;ve logged
              some.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {breakdown.rows.map((row) => (
              <div key={row.category} className="rounded-card border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses(colorFor(row.category))}`}>
                    {row.category}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(row.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className="h-full rounded-full bg-navy transition-all"
                    style={{ width: `${Math.max(row.pct, 2)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">{row.pct.toFixed(1)}% of total</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">Manage {type} categories</h3>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
          >
            + Add category
          </button>
        </div>

        {deleteError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {categoriesForType.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                i === categoriesForType.length - 1 ? "" : "border-b border-line"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses(c.color)}`} />
                <span className="truncate font-medium text-foreground">{c.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setModal({ mode: "edit", category: c })}
                  aria-label={`Edit ${c.name}`}
                  className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
                  </svg>
                </button>
                {c.name !== "Other" && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      confirmDeleteId === c.id
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    }`}
                  >
                    {confirmDeleteId === c.id ? "Confirm" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {modal && (
        <CategoryModal
          type={type}
          category={modal.mode === "edit" ? modal.category : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
