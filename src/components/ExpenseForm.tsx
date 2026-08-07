"use client";

import { useState } from "react";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { todayInputValue } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
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
  // Collapsed by default to keep the common case short — expanded upfront if
  // there's already something in one of these fields (e.g. editing an
  // existing entry) so nothing looks silently hidden.
  const [moreOpen, setMoreOpen] = useState(
    () => Boolean(initialValues.walletId) || initialValues.tags.length > 0 || initialValues.notes.trim().length > 0,
  );
  const amountColorClass =
    values.type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : values.type === "expense"
        ? "text-red-600 dark:text-red-400"
        : "text-surface-foreground";
  function categoryDot(name: string) {
    const c = categories.find((cat) => cat.name === name);
    return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses(c?.color)}`} aria-hidden="true" />;
  }

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
    // Below sm: a single mobile-optimized column in DOM order (hero amount,
    // then merchant, category, date, collapsed "more details"). At sm+: a
    // real two-column desktop layout — same fields, but amount/date share a
    // row, wallet/tags/notes are always visible instead of behind a
    // disclosure (no scroll-fatigue reason to hide them with a mouse and
    // more vertical room), and every sm:order-N below controls the desktop
    // sequence independent of DOM order, which stays mobile-first.
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:grid sm:grid-cols-2 sm:items-start sm:gap-x-5 sm:gap-y-4 sm:space-y-0"
    >
      <div className="flex gap-1 rounded-full bg-bg-soft p-1 sm:order-1 sm:col-span-2">
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
        <div className="sm:order-2 sm:col-span-2">
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

      {/* Amount leads — it's the one field every entry has and the one
          you're most likely typing right after opening this form, so it
          gets a hero-sized, type-colored input instead of sitting level
          with everything else. */}
      <div className="text-center sm:order-3 sm:text-left">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft" htmlFor="amount">
          Amount
        </label>
        {splitMode ? (
          <div className={`py-1 text-4xl font-bold tabular-nums sm:text-3xl ${amountColorClass}`}>{splitTotal.toFixed(2)}</div>
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
            className={`w-full bg-transparent text-center text-4xl font-bold tabular-nums outline-none placeholder:text-surface-foreground-soft/40 sm:text-left sm:text-3xl ${amountColorClass}`}
          />
        )}
      </div>

      <div className="sm:order-4">
        <label className={labelClass} htmlFor="date">
          Date
        </label>
        <DatePicker id="date" value={values.date} onChange={(date) => update("date", date)} required />
      </div>

      <div className="sm:order-5 sm:col-span-2">
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
        <label className="flex items-center gap-2 text-sm font-medium text-surface-foreground-soft sm:order-6 sm:col-span-2">
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
        <div className="space-y-2.5 sm:order-7 sm:col-span-2">
          <label className={labelClass}>Categories &amp; amounts</label>
          {splitLines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <SelectDropdown
                  value={line.category}
                  options={categories.map((c) => c.name)}
                  onChange={(name) => updateSplitLine(i, { category: name })}
                  renderIndicator={categoryDot}
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
        <div className="sm:order-7 sm:col-span-2">
          <label className={labelClass} htmlFor="category">
            Category
          </label>
          <SelectDropdown
            id="category"
            value={values.category}
            options={categories.map((c) => c.name)}
            onChange={(name) => update("category", name)}
            renderIndicator={categoryDot}
          />
        </div>
      )}

      {/* Wallet/tags/notes are all optional and, for most entries, left at
          their defaults. On mobile they're tucked behind a disclosure so the
          common fast-entry case doesn't scroll past three more fields; at
          sm+ the toggle is hidden and the panel forced open via CSS (see
          sm:!block below) since there's no scroll-fatigue reason to hide
          them with a mouse and more vertical room to work with. Still
          starts open on mobile if any already has a value (see moreOpen's
          initializer), so editing an existing entry never hides data that's
          actually there. */}
      <div className="rounded-card border border-surface-line sm:order-8 sm:col-span-2 sm:border-0 sm:p-0">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-surface-foreground-soft sm:hidden"
        >
          More details
          <svg
            viewBox="0 0 21.6895 12.959"
            fill="currentColor"
            className={`h-3 w-3 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          >
            <path d="M10.6641 12.959C10.9473 12.959 11.2109 12.832 11.4062 12.6172L21.0352 2.58789C21.2207 2.40234 21.3281 2.16797 21.3281 1.89453C21.3281 1.34766 20.9082 0.927734 20.3516 0.927734C20.0977 0.927734 19.8438 1.02539 19.6582 1.20117L10.0684 11.1816L11.2695 11.1816L1.66016 1.20117C1.48438 1.02539 1.24023 0.927734 0.976562 0.927734C0.419922 0.927734 0 1.34766 0 1.89453C0 2.16797 0.117188 2.40234 0.292969 2.59766L9.92188 12.627C10.1367 12.832 10.3809 12.959 10.6641 12.959Z" />
          </svg>
        </button>
        <div
          className={`${moreOpen ? "block" : "hidden"} space-y-4 border-t border-surface-line p-3.5 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 sm:space-y-0 sm:border-0 sm:p-0`}
        >
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
            <label className={labelClass}>Tags</label>
            <TagInput tags={values.tags} onChange={(tags) => update("tags", tags)} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="notes">
              Notes
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
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 sm:order-9 sm:col-span-2">{error}</p>}

      {/* Sticky rather than flowing at the end of the form: this form runs
          15+ fields long, and on mobile (where the modal is a bottom sheet
          capped at the visible viewport height) the on-screen keyboard can
          push a non-sticky submit button below the fold with no cue that
          it's still there. Negative margins extend it edge-to-edge past the
          modal's own padding, then re-add that padding just for this bar. */}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex items-center justify-between gap-2 border-t border-surface-line bg-surface/95 px-5 py-3 backdrop-blur-xl sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:order-10 sm:col-span-2 sm:px-6">
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
