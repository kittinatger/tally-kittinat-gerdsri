"use client";

import { useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import SelectDropdown from "./SelectDropdown";

type Budget = { id: number; category: string; monthly_limit: string };

export default function BudgetManager() {
  const allCategories = useAllCategories();
  const currency = useCurrency();
  const expenseCategories = allCategories.filter((c) => c.type === "expense");

  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [category, setCategory] = useState(expenseCategories[0]?.name ?? "Other");
  const [limit, setLimit] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/budgets")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setBudgets(data.budgets ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your budgets.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthlyLimit: Number(limit) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save that budget.");
        return;
      }
      setBudgets((prev) => [...(prev ?? []).filter((b) => b.category !== data.budget.category), data.budget]);
      setAdding(false);
      setLimit("");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets((prev) => (prev ?? []).filter((b) => b.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Budgets</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? "Cancel" : "Set a budget"}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        Set a monthly spending limit per category. Add the &quot;Budgets&quot; widget to your dashboard to see
        progress at a glance.
      </p>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Category</label>
              <SelectDropdown value={category} options={expenseCategories.map((c) => c.name)} onChange={setCategory} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Monthly limit</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save budget"}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {budgets === null ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : budgets.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No budgets set yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {budgets.map((b, i) => (
            <div
              key={b.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i === budgets.length - 1 ? "" : "border-b border-line"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{b.category}</p>
                <p className="text-xs text-ink-soft">{formatCurrency(Number(b.monthly_limit), currency)} / month</p>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={busyId === b.id}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
