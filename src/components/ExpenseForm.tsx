"use client";

import { useState } from "react";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { todayInputValue } from "@/lib/format";
import TagInput from "./TagInput";
import DatePicker from "./DatePicker";
import SelectDropdown from "./SelectDropdown";

export type ExpenseFormValues = {
  type: TransactionType;
  /** Only meaningful when type is "transfer". */
  direction: TransferDirection;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string;
  tags: string[];
};

export const emptyExpenseFormValues: ExpenseFormValues = {
  type: "expense",
  direction: "out",
  date: todayInputValue(),
  amount: "",
  merchant: "",
  category: "Other",
  notes: "",
  tags: [],
};

const inputClass =
  "w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-surface-foreground-soft";

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
  const allCategories = useAllCategories();
  const categories = allCategories.filter((c) => c.type === values.type);
  const sourceLabel = values.type === "income" ? "Source" : values.type === "transfer" ? "Description" : "Merchant";

  function update<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateType(type: TransactionType) {
    setValues((prev) => {
      const stillValid = allCategories.some((c) => c.type === type && c.name === prev.category);
      return { ...prev, type, category: stillValid ? prev.category : "Other" };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 rounded-full bg-bg-soft p-1">
        <button
          type="button"
          onClick={() => updateType("expense")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            values.type === "expense" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => updateType("income")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            values.type === "income" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => updateType("transfer")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            values.type === "transfer" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Transfer
        </button>
      </div>

      {values.type === "transfer" && (
        <div>
          <label className={labelClass}>Direction</label>
          <div className="flex gap-1 rounded-full bg-bg-soft p-1">
            <button
              type="button"
              onClick={() => update("direction", "out")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.direction === "out"
                  ? "bg-surface-soft text-surface-foreground shadow-sm"
                  : "text-surface-foreground-soft"
              }`}
            >
              Money out
            </button>
            <button
              type="button"
              onClick={() => update("direction", "in")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.direction === "in"
                  ? "bg-surface-soft text-surface-foreground shadow-sm"
                  : "text-surface-foreground-soft"
              }`}
            >
              Money in
            </button>
          </div>
          <p className="mt-1.5 text-xs text-surface-foreground-soft">
            Transfers aren&apos;t counted as income or spending, but still move your Remaining balance.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="date">
            Date
          </label>
          <DatePicker id="date" value={values.date} onChange={(date) => update("date", date)} required />
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
          {sourceLabel}
        </label>
        <input
          id="merchant"
          type="text"
          required
          value={values.merchant}
          onChange={(e) => update("merchant", e.target.value)}
          placeholder={
            values.type === "income" ? "e.g. Acme Corp" : values.type === "transfer" ? "e.g. E-wallet top-up" : "e.g. Whole Foods"
          }
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Category
        </label>
        <SelectDropdown
          id="category"
          value={values.category}
          options={categories.map((c) => c.name)}
          onChange={(name) => update("category", name)}
        />
      </div>

      <div>
        <label className={labelClass}>Tags (optional)</label>
        <TagInput tags={values.tags} onChange={(tags) => update("tags", tags)} />
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
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
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
