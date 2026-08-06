"use client";

import { useState } from "react";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
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
  /** null means "use the default wallet" — resolved server-side. */
  walletId: number | null;
  /** Only meaningful when allowSplit is used and split mode is on — see AddExpenseModal. */
  splitLines?: { category: string; amount: string }[];
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
  walletId: null,
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
  allowSplit = false,
}: {
  initialValues: ExpenseFormValues;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  footerLeft?: React.ReactNode;
  /** Shows a "Split into multiple categories" toggle for expense/income entries — see AddExpenseModal. */
  allowSplit?: boolean;
}) {
  const [values, setValues] = useState<ExpenseFormValues>(initialValues);
  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState<{ category: string; amount: string }[]>([
    { category: "Other", amount: "" },
    { category: "Other", amount: "" },
  ]);
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const categories = allCategories.filter((c) => c.type === values.type);
  const defaultWallet = wallets.find((w) => w.isDefault) ?? wallets[0];
  const selectedWalletId = values.walletId ?? defaultWallet?.id ?? null;
  const selectedWalletName = wallets.find((w) => w.id === selectedWalletId)?.name ?? "";
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

  const splitTotal = splitLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  function updateSplitLine(index: number, patch: Partial<{ category: string; amount: string }>) {
    setSplitLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addSplitLine() {
    setSplitLines((prev) => [...prev, { category: "Other", amount: "" }]);
  }

  function removeSplitLine(index: number) {
    setSplitLines((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (splitMode) {
      onSubmit({ ...values, splitLines });
      return;
    }
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
          {splitMode ? (
            <div className={`${inputClass} flex items-center text-surface-foreground-soft`}>{splitTotal.toFixed(2)}</div>
          ) : (
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
          )}
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

      {allowSplit && values.type !== "transfer" && (
        <label className="flex items-center gap-2 text-sm font-medium text-surface-foreground-soft">
          <input
            type="checkbox"
            checked={splitMode}
            onChange={(e) => setSplitMode(e.target.checked)}
            className="h-4 w-4 rounded border-surface-line accent-surface-accent"
          />
          Split into multiple categories
        </label>
      )}

      {splitMode ? (
        <div className="space-y-2.5">
          <label className={labelClass}>Categories &amp; amounts</label>
          {splitLines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <SelectDropdown
                  value={line.category}
                  options={categories.map((c) => c.name)}
                  onChange={(name) => updateSplitLine(i, { category: name })}
                />
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={line.amount}
                onChange={(e) => updateSplitLine(i, { amount: e.target.value })}
                placeholder="0.00"
                className={`${inputClass} w-28`}
              />
              {splitLines.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSplitLine(i)}
                  aria-label="Remove line"
                  className="shrink-0 rounded-full p-2 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSplitLine}
            className="text-sm font-semibold text-surface-accent hover:underline"
          >
            + Add another category
          </button>
        </div>
      ) : (
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
      )}

      {wallets.length > 0 && (
        <div>
          <label className={labelClass} htmlFor="wallet">
            Wallet
          </label>
          <SelectDropdown
            id="wallet"
            value={selectedWalletName}
            options={wallets.map((w) => w.name)}
            onChange={(name) => {
              const wallet = wallets.find((w) => w.name === name);
              if (wallet) update("walletId", wallet.id);
            }}
          />
        </div>
      )}

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

      {/* Sticky rather than flowing at the end of the form: this form runs
          15+ fields long, and on mobile (where the modal is a bottom sheet
          capped at the visible viewport height) the on-screen keyboard can
          push a non-sticky submit button below the fold with no cue that
          it's still there. Negative margins extend it edge-to-edge past the
          modal's own padding, then re-add that padding just for this bar. */}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex items-center justify-between gap-2 border-t border-surface-line bg-surface/95 px-5 py-3 backdrop-blur-xl sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
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
