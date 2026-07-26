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
  "w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100";
const labelClass = "mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

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
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
