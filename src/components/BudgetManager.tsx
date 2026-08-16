"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useCallback, useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, TrashIcon } from "@/lib/icons";
import SelectDropdown from "./SelectDropdown";
import CsvManagerButtons from "./CsvManagerButtons";
import { useT } from "@/lib/language-context";

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

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function BudgetManager() {
  const t = useT();
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
        <h3 className="font-display text-xl text-foreground">{t("budget.title")}</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? t("common.cancel") : t("budget.setABudget")}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        {t("budget.desc")}
      </p>

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/budgets/export" importUrl="/api/budgets/import" onImported={refetch} />
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("common.category")}</label>
              <SelectDropdown value={category} options={expenseCategories.map((c) => c.name)} onChange={setCategory} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("budget.monthlyLimit")}</label>
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
            {t("budget.rolloverToggle")}
          </button>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? t("common.saving") : t("budget.saveBudget")}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {budgets === null ? (
        <p className="mt-4 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : budgets.length === 0 ? (
        <EmptyState icon={<BudgetGlyphIcon />} text={t("budget.noBudgetsYet")} />
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
                  {cat?.icon && isCategoryIconKey(cat.icon) ? (
                    <CategoryIcon iconKey={cat.icon} className="h-4.5 w-4.5" />
                  ) : (
                    b.category.charAt(0).toUpperCase()
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-foreground">{b.category}</p>
                    {b.rollover && (
                      <span className="shrink-0 rounded-full bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy dark:text-blue-300">
                        {t("budget.rollover")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft">{formatCurrency(Number(b.monthly_limit), currency)} {t("budget.perMonth")}</p>
                </div>

                {confirming ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={busyId === b.id}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={busyId === b.id}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === b.id ? t("common.deleting") : t("common.confirmDelete")}
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
