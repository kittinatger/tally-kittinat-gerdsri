"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useCallback, useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import SelectDropdown from "./SelectDropdown";
import CsvManagerButtons from "./CsvManagerButtons";

type Budget = { id: number; category: string; monthly_limit: string; rollover: boolean };

function BudgetGlyphIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <path d="M3 8.5h14" />
      <path d="M7 12h2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 25.6738 31.2305" fill="currentColor" className="h-4 w-4">
      <path d="M8.76953 24.8389C8.19824 24.8389 7.8125 24.4727 7.7832 23.9014L7.39258 10.3271C7.37305 9.74609 7.75391 9.37988 8.34961 9.37988C8.9209 9.37988 9.31641 9.74121 9.33594 10.3174L9.74121 23.8867C9.76074 24.458 9.375 24.8389 8.76953 24.8389ZM12.6611 24.8389C12.0752 24.8389 11.6797 24.4678 11.6797 23.9014L11.6797 10.3125C11.6797 9.74609 12.0752 9.37988 12.6611 9.37988C13.2422 9.37988 13.6377 9.74609 13.6377 10.3125L13.6377 23.9014C13.6377 24.4678 13.2422 24.8389 12.6611 24.8389ZM16.543 24.8389C15.9375 24.8389 15.5566 24.458 15.5762 23.8916L15.9766 10.3223C15.9961 9.74609 16.3916 9.37988 16.9678 9.37988C17.5635 9.37988 17.9395 9.75098 17.9248 10.332L17.5293 23.9014C17.5 24.4775 17.1143 24.8389 16.543 24.8389ZM6.73828 5.78125L9.34082 5.78125L9.34082 3.2666C9.34082 2.6709 9.75586 2.29004 10.4199 2.29004L14.8779 2.29004C15.542 2.29004 15.957 2.6709 15.957 3.2666L15.957 5.78125L18.5596 5.78125L18.5596 3.17383C18.5596 1.15723 17.2949 0 15.0635 0L10.2344 0C8.00781 0 6.73828 1.15723 6.73828 3.17383ZM1.26953 7.53418L24.043 7.53418C24.7656 7.53418 25.3125 7.00195 25.3125 6.28418C25.3125 5.57129 24.7656 5.04395 24.043 5.04395L1.26953 5.04395C0.556641 5.04395 0 5.57617 0 6.28418C0 7.00684 0.556641 7.53418 1.26953 7.53418ZM6.87012 28.8232L18.457 28.8232C20.4883 28.8232 21.7822 27.6416 21.8799 25.6006L22.7441 7.27539L2.57324 7.27539L3.4375 25.6055C3.53516 27.6514 4.81445 28.8232 6.87012 28.8232Z" />
    </svg>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [category, setCategory] = useState(expenseCategories[0]?.name ?? "Other");
  const [limit, setLimit] = useState("");
  const [rollover, setRollover] = useState(false);

  const refetch = useCallback(() => {
    return fetch("/api/budgets")
      .then((res) => res.json())
      .then((data) => setBudgets(data.budgets ?? []))
      .catch(() => setLoadError("Could not load your budgets."));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthlyLimit: Number(limit), rollover }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save that budget.");
        return;
      }
      setBudgets((prev) => [...(prev ?? []).filter((b) => b.category !== data.budget.category), data.budget]);
      setAdding(false);
      setLimit("");
      setRollover(false);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets((prev) => (prev ?? []).filter((b) => b.id !== id));
      }
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
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

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/budgets/export" importUrl="/api/budgets/import" onImported={refetch} />
      </div>

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
                className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={rollover}
            onClick={() => setRollover((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-surface-foreground-soft"
          >
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${rollover ? "bg-navy" : "bg-bg-soft"}`}>
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  rollover ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            Roll over unused budget into next month
          </button>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
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
        <EmptyState icon={<BudgetGlyphIcon />} text="No budgets set yet — add one above to track spending per category." />
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {budgets.map((b, i) => {
            const cat = allCategories.find((c) => c.type === "expense" && c.name === b.category);
            const confirming = confirmDeleteId === b.id;
            return (
              <div
                key={b.id}
                className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badgeClasses(cat?.color)}`}>
                  {cat?.icon ? cat.icon : b.category.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-foreground">{b.category}</p>
                    {b.rollover && (
                      <span className="shrink-0 rounded-full bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy dark:text-blue-300">
                        Rollover
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft">{formatCurrency(Number(b.monthly_limit), currency)} / month</p>
                </div>

                {confirming ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={busyId === b.id}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={busyId === b.id}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === b.id ? "Deleting..." : "Confirm delete"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(b.id)}
                    aria-label={`Delete budget for ${b.category}`}
                    className="shrink-0 rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
