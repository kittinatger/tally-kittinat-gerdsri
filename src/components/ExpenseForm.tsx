"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { todayInputValue } from "@/lib/format";

export type ExpenseFormValues = {
  date: string;
  amount: string;
  merchant: string;
  category: Category;
  notes: string;
};

export const emptyExpenseFormValues: ExpenseFormValues = {
  date: todayInputValue(),
  amount: "",
  merchant: "",
  category: "Other",
  notes: "",
};

const inputClass =
  "w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export default function ExpenseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
  footerLeft,
}: {
  initialValues: ExpenseFormValues;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  footerLeft?: React.ReactNode;
}) {
  const [values, setValues] = useState<ExpenseFormValues>(initialValues);

  function update<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={values.date}
            onChange={(e) => update("date", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={values.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="merchant">
          Merchant
        </label>
        <input
          id="merchant"
          type="text"
          required
          value={values.merchant}
          onChange={(e) => update("merchant", e.target.value)}
          placeholder="e.g. Whole Foods"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Category
        </label>
        <select
          id="category"
          value={values.category}
          onChange={(e) => update("category", e.target.value as Category)}
          className={inputClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={2}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Add a note..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div>{footerLeft}</div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
