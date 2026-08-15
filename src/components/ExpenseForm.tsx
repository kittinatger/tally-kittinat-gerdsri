"use client";

import { useEffect, useState } from "react";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { todayInputValue } from "@/lib/format";
import { dotClasses } from "@/lib/category-styles";
import { ChevronIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
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
  /** Only meaningful when allowFriendSplit is used and friend-split mode is on — see AddExpenseModal. Divides the bill between you (the payer) and the listed friends; your own share is whatever's left after theirs. */
  splitWithFriends?: {
    participantIds: number[];
    splitMethod: "equal" | "custom";
    customOwed?: { userId: number; amount: number }[];
  };
};

type Friend = { id: number; username: string };

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
  allowFriendSplit = false,
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
  /** Shows a "Split this bill with friends" toggle for expense entries — see AddExpenseModal. */
  allowFriendSplit?: boolean;
}) {
  const t = useT();
  const [values, setValues] = useState<ExpenseFormValues>(initialValues);
  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState<{ category: string; amount: string }[]>([
    { category: "Other", amount: "" },
    { category: "Other", amount: "" },
  ]);
  const [friendSplitMode, setFriendSplitMode] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendIds, setFriendIds] = useState<number[]>([]);
  const [friendSplitMethod, setFriendSplitMethod] = useState<"equal" | "custom">("equal");
  const [customFriendOwed, setCustomFriendOwed] = useState<Record<number, string>>({});
  const allCategories = useAllCategories();
  const wallets = useWallets();

  useEffect(() => {
    if (!allowFriendSplit) return;
    let cancelled = false;
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.friends)) setFriends(data.friends);
      })
      .catch(() => {
        // Leave the list empty — the toggle just won't have anyone to pick.
      });
    return () => {
      cancelled = true;
    };
  }, [allowFriendSplit]);
  const categories = allCategories.filter((c) => c.type === values.type);
  const defaultWallet = wallets.find((w) => w.isDefault) ?? wallets[0];
  const selectedWalletId = values.walletId ?? defaultWallet?.id ?? null;
  const selectedWalletName = wallets.find((w) => w.id === selectedWalletId)?.name ?? "";
  const sourceLabel =
    values.type === "income" ? t("form.source") : values.type === "transfer" ? t("form.description") : t("form.merchant");
  // Collapsed by default to keep the common case short — expanded upfront if
  // there's already something in one of these fields (e.g. editing an
  // existing entry) so nothing looks silently hidden.
  const [moreOpen, setMoreOpen] = useState(
    () => initialValues.tags.length > 0 || initialValues.notes.trim().length > 0,
  );
  // One accent per type, threaded through the header band, the submit
  // button, and the torn-edge divider between them — the whole form reads
  // as a single "ticket" for whichever kind of entry you're making.
  const bandGradientClass =
    values.type === "income"
      ? "from-emerald-400 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800"
      : values.type === "expense"
        ? "from-rose-400 to-rose-600 dark:from-rose-600 dark:to-rose-800"
        : "from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-800";
  const chipActiveClass =
    values.type === "income"
      ? "bg-white text-emerald-700"
      : values.type === "expense"
        ? "bg-white text-rose-700"
        : "bg-white text-sky-700";
  const submitButtonClass =
    values.type === "income"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : values.type === "expense"
        ? "bg-rose-500 hover:bg-rose-600"
        : "bg-sky-500 hover:bg-sky-600";
  // Fakes a torn-paper edge under the header band with two diagonal
  // gradients tiled into little triangles, in the app's own surface color
  // so it reads as a notch cut out of the band revealing the page behind —
  // no image assets, just a repeating CSS background.
  const tornEdgeStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(135deg, var(--surface) 50%, transparent 50%), linear-gradient(225deg, var(--surface) 50%, transparent 50%)",
    backgroundSize: "14px 14px",
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
  };
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

  function toggleFriend(id: number) {
    setFriendIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const withFriends =
      values.type === "expense" && friendSplitMode && friendIds.length > 0
        ? {
            splitWithFriends: {
              participantIds: friendIds,
              splitMethod: friendSplitMethod,
              customOwed:
                friendSplitMethod === "custom"
                  ? friendIds.map((id) => ({ userId: id, amount: Number(customFriendOwed[id]) || 0 }))
                  : undefined,
            },
          }
        : {};
    if (splitMode) {
      onSubmit({ ...values, splitLines, ...withFriends });
      return;
    }
    onSubmit({ ...values, ...withFriends });
  }

  return (
    // Below sm: a single mobile-optimized column in DOM order (colored
    // ticket header, then merchant, category, date, wallet, collapsed
    // "Tags & notes"). At sm+: a real two-column desktop layout — same
    // fields, but Date/Wallet share a row and tags/notes are always visible
    // instead of behind a disclosure (no scroll-fatigue reason to hide them
    // with a mouse and more vertical room) — every sm:order-N below controls
    // the desktop sequence independent of DOM order, which stays
    // mobile-first.
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:grid sm:grid-cols-2 sm:items-start sm:gap-x-5 sm:gap-y-4 sm:space-y-0"
    >
      {/* The whole entry reads as one "ticket": a bold colored header band
          (type toggle, transfer direction, hero amount) bleeding edge-to-
          edge past the modal's own padding, torn off from the plain body
          below it with a faked paper-notch edge instead of a hard line. */}
      <div className="-mx-5 sm:order-1 sm:col-span-2 sm:-mx-6">
        <div className={`bg-gradient-to-br px-5 pb-5 pt-1 text-white transition-colors sm:px-6 ${bandGradientClass}`}>
          <div className="flex gap-1 rounded-full bg-white/15 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => updateType("expense")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.type === "expense" ? chipActiveClass + " shadow-sm" : "text-white/75 hover:text-white"
              }`}
            >
              {t("common.expense")}
            </button>
            <button
              type="button"
              onClick={() => updateType("income")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.type === "income" ? chipActiveClass + " shadow-sm" : "text-white/75 hover:text-white"
              }`}
            >
              {t("common.income")}
            </button>
            <button
              type="button"
              onClick={() => updateType("transfer")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.type === "transfer" ? chipActiveClass + " shadow-sm" : "text-white/75 hover:text-white"
              }`}
            >
              {t("common.transfer")}
            </button>
          </div>

          {values.type === "transfer" && (
            <div className="mt-3">
              <div className="flex gap-1 rounded-full bg-white/15 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => update("direction", "out")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                    values.direction === "out" ? "bg-white text-sky-700 shadow-sm" : "text-white/75 hover:text-white"
                  }`}
                >
                  {t("form.moneyOut")}
                </button>
                <button
                  type="button"
                  onClick={() => update("direction", "in")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                    values.direction === "in" ? "bg-white text-sky-700 shadow-sm" : "text-white/75 hover:text-white"
                  }`}
                >
                  {t("form.moneyIn")}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-white/70">{t("form.transferNote")}</p>
            </div>
          )}

          <div className="mt-4 text-center sm:text-left">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="amount">
              {t("form.amount")}
            </label>
            {splitMode ? (
              <div className="py-1 text-4xl font-bold tabular-nums sm:text-3xl">{splitTotal.toFixed(2)}</div>
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
                className="w-full bg-transparent text-center text-4xl font-bold tabular-nums outline-none placeholder:text-white/40 sm:text-left sm:text-3xl"
              />
            )}
          </div>
        </div>
        <div className="h-3.5" style={tornEdgeStyle} />
      </div>

      <div className="sm:order-2 sm:col-span-2">
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
            values.type === "income"
              ? t("form.merchantPlaceholderIncome")
              : values.type === "transfer"
                ? t("form.merchantPlaceholderTransfer")
                : t("form.merchantPlaceholderExpense")
          }
          className={inputClass}
        />
      </div>

      {allowSplit && values.type !== "transfer" && (
        <label className="flex items-center gap-2 text-sm font-medium text-surface-foreground-soft sm:order-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={splitMode}
            onChange={(e) => setSplitMode(e.target.checked)}
            className="h-4 w-4 rounded border-surface-line accent-surface-accent"
          />
          {t("form.splitIntoCategories")}
        </label>
      )}

      {splitMode ? (
        <div className="space-y-2.5 sm:order-4 sm:col-span-2">
          <label className={labelClass}>{t("form.categoriesAndAmounts")}</label>
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
            {t("form.addAnotherCategory")}
          </button>
        </div>
      ) : (
        <div className="sm:order-4 sm:col-span-2">
          <label className={labelClass}>{t("common.category")}</label>
          {/* A horizontal chip strip instead of a dropdown — every category
              is a single tap away and its own color rides along, instead of
              being hidden a menu open away. */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {categories.map((c) => {
              const selected = values.category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => update("category", c.name)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    selected
                      ? "border-transparent bg-surface-accent/10 text-surface-accent"
                      : "border-surface-line text-surface-foreground-soft hover:border-surface-accent hover:text-surface-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses(c.color)}`} aria-hidden="true" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="sm:order-5">
        <label className={labelClass} htmlFor="date">
          {t("common.date")}
        </label>
        <DatePicker id="date" value={values.date} onChange={(date) => update("date", date)} required />
      </div>

      {wallets.length > 0 && (
        <div className="sm:order-6">
          <label className={labelClass} htmlFor="wallet">
            {t("common.wallet")}
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

      {allowFriendSplit && values.type === "expense" && friends.length > 0 && (
        <label className="flex items-center gap-2 text-sm font-medium text-surface-foreground-soft sm:order-7 sm:col-span-2">
          <input
            type="checkbox"
            checked={friendSplitMode}
            onChange={(e) => setFriendSplitMode(e.target.checked)}
            className="h-4 w-4 rounded border-surface-line accent-surface-accent"
          />
          Split this bill with friends
        </label>
      )}

      {values.type === "expense" && friendSplitMode && (
        <div className="space-y-2.5 sm:order-7 sm:col-span-2">
          <div>
            <label className={labelClass}>Who else was in on it?</label>
            <div className="flex flex-wrap gap-1.5">
              {friends.map((f) => {
                const selected = friendIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      selected
                        ? "bg-surface-accent text-white"
                        : "bg-surface-soft text-surface-foreground-soft hover:text-surface-foreground"
                    }`}
                  >
                    {f.username}
                  </button>
                );
              })}
            </div>
          </div>

          {friendIds.length > 0 && (
            <>
              <div className="flex gap-1 rounded-full bg-surface-soft p-1">
                <button
                  type="button"
                  onClick={() => setFriendSplitMethod("equal")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                    friendSplitMethod === "equal"
                      ? "bg-surface text-surface-foreground shadow-sm"
                      : "text-surface-foreground-soft"
                  }`}
                >
                  Equal split
                </button>
                <button
                  type="button"
                  onClick={() => setFriendSplitMethod("custom")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                    friendSplitMethod === "custom"
                      ? "bg-surface text-surface-foreground shadow-sm"
                      : "text-surface-foreground-soft"
                  }`}
                >
                  Custom amounts
                </button>
              </div>

              {friendSplitMethod === "custom" ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-surface-foreground-soft">How much does each person owe you?</p>
                  {friendIds.map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 truncate text-sm text-surface-foreground">
                        {friends.find((f) => f.id === id)?.username}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={customFriendOwed[id] ?? ""}
                        onChange={(e) => setCustomFriendOwed((prev) => ({ ...prev, [id]: e.target.value }))}
                        placeholder="0.00"
                        className={`${inputClass} flex-1`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-foreground-soft">
                  Split evenly between you and {friendIds.length} friend{friendIds.length === 1 ? "" : "s"} — they&apos;ll each
                  owe their share, tracked in Split bills.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Tags/notes are optional and, for most entries, left blank. On
          mobile they're tucked behind a disclosure so the common fast-entry
          case doesn't scroll past two more fields; at sm+ the toggle is
          hidden and the panel forced open via CSS since there's no
          scroll-fatigue reason to hide them with a mouse and more vertical
          room to work with. Still starts open on mobile if either already
          has a value (see moreOpen's initializer), so editing an existing
          entry never hides data that's actually there. */}
      <div className="rounded-card border border-surface-line sm:order-9 sm:col-span-2 sm:border-0 sm:p-0">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-surface-foreground-soft sm:hidden"
        >
          {t("form.tagsAndNotes")}
          <ChevronIcon className={`h-3 w-3 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </button>
        <div
          className={`${moreOpen ? "block" : "hidden"} space-y-4 border-t border-surface-line p-3.5 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 sm:space-y-0 sm:border-0 sm:p-0`}
        >
          <div>
            <label className={labelClass}>{t("common.tags")}</label>
            <TagInput tags={values.tags} onChange={(tags) => update("tags", tags)} />
          </div>

          <div>
            <label className={labelClass} htmlFor="notes">
              {t("common.notes")}
            </label>
            <textarea
              id="notes"
              rows={2}
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("form.notesPlaceholder")}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 sm:order-10 sm:col-span-2">{error}</p>}

      {/* Sticky rather than flowing at the end of the form: this form runs
          15+ fields long, and on mobile (where the modal is a bottom sheet
          capped at the visible viewport height) the on-screen keyboard can
          push a non-sticky submit button below the fold with no cue that
          it's still there. Negative margins extend it edge-to-edge past the
          modal's own padding, then re-add that padding just for this bar. */}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex items-center justify-between gap-2 border-t border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-5 py-3 backdrop-blur-xl sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:order-10 sm:col-span-2 sm:px-6">
        <div>{footerLeft}</div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition disabled:opacity-60 ${submitButtonClass}`}
          >
            {submitting ? t("common.saving") : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
