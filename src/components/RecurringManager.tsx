"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useCallback, useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import { EditIcon, TrashIcon } from "@/lib/icons";
import SelectDropdown from "./SelectDropdown";
import CsvManagerButtons from "./CsvManagerButtons";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

type RecurringCandidate = {
  key: string;
  type: string;
  direction: string | null;
  merchant: string;
  category: string;
  amount: number;
  frequency: string;
  suggestedNextRunDate: string;
  occurrenceCount: number;
  walletId: number | null;
};

type RecurringRule = {
  id: number;
  type: string;
  direction: string | null;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  wallet_id: number | null;
  frequency: string;
  next_run_date: string;
  active: boolean;
};

const FREQUENCY_KEYS: Record<string, MessageKey> = {
  weekly: "recurring.weekly",
  monthly: "recurring.monthly",
  yearly: "recurring.yearly",
};

function RepeatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M4 7h9a2.5 2.5 0 0 1 2.5 2.5V11M16 13H7a2.5 2.5 0 0 1-2.5-2.5V9" />
      <path d="M6.5 4.5 4 7l2.5 2.5M13.5 15.5 16 13l-2.5-2.5" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 4v12l7-6-7-6ZM12 4v12l7-6-7-6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <rect x="4.5" y="3.5" width="4" height="13" rx="1" />
      <rect x="11.5" y="3.5" width="4" height="13" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M5.5 3.7c0-.9 1-1.4 1.7-.9l9.4 6.3a1 1 0 0 1 0 1.7l-9.4 6.3c-.7.5-1.7 0-1.7-.9Z" />
    </svg>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">
        <RepeatIcon />
      </span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function RecurringManager() {
  const t = useT();
  const FREQUENCY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(FREQUENCY_KEYS).map(([k, v]) => [k, t(v)]),
  );
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const currency = useCurrency();

  const [rules, setRules] = useState<RecurringRule[] | null>(null);
  const [suggestions, setSuggestions] = useState<RecurringCandidate[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [acceptingKey, setAcceptingKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"closed" | "add" | number>("closed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const adding = formMode !== "closed";

  const [type, setType] = useState<TransactionType>("expense");
  const [direction, setDirection] = useState<TransferDirection>("out");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Other");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(todayInputValue());

  const refetch = useCallback(() => {
    return fetch("/api/recurring")
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? []))
      .catch(() => setLoadError("Could not load your recurring transactions."));
  }, []);

  useEffect(() => {
    refetch();
    fetch("/api/recurring/suggestions")
      .then((res) => res.json())
      .then((data) => setSuggestions(data.candidates ?? []))
      .catch(() => {
        // Non-critical — the suggestions section just stays empty rather
        // than blocking the rest of the page.
      });
  }, [refetch]);

  async function handleAcceptSuggestion(c: RecurringCandidate) {
    setAcceptingKey(c.key);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: c.type,
          direction: c.type === "transfer" ? (c.direction ?? "out") : undefined,
          amount: c.amount,
          merchant: c.merchant,
          category: c.category,
          walletId: c.walletId,
          frequency: c.frequency,
          startDate: c.suggestedNextRunDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRules((prev) => [...(prev ?? []), data.rule]);
        setDismissedKeys((prev) => new Set(prev).add(c.key));
      }
    } finally {
      setAcceptingKey(null);
    }
  }

  const categories = allCategories.filter((c) => c.type === type);
  const defaultWallet = wallets.find((w) => w.isDefault) ?? wallets[0];
  const selectedWalletName = wallets.find((w) => w.id === (walletId ?? defaultWallet?.id))?.name ?? "";

  function resetForm() {
    setFormMode("closed");
    setAmount("");
    setMerchant("");
    setCategory("Other");
    setType("expense");
    setWalletId(null);
    setFrequency("monthly");
    setStartDate(todayInputValue());
  }

  function startAdd() {
    resetForm();
    setFormMode("add");
  }

  function startEdit(rule: RecurringRule) {
    setType(rule.type === "income" || rule.type === "transfer" ? rule.type : "expense");
    setDirection(rule.direction === "in" ? "in" : "out");
    setAmount(rule.amount);
    setMerchant(rule.merchant);
    setCategory(rule.category);
    setWalletId(rule.wallet_id);
    setFrequency(rule.frequency);
    setError(null);
    setFormMode(rule.id);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const isEdit = typeof formMode === "number";
      const res = isEdit
        ? await fetch(`/api/recurring/${formMode}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Number(amount), merchant, category, walletId, frequency }),
          })
        : await fetch("/api/recurring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              direction: type === "transfer" ? direction : undefined,
              amount: Number(amount),
              merchant,
              category,
              walletId,
              frequency,
              startDate,
            }),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save that rule.");
        return;
      }
      const saved = isEdit ? data.rule : data.rule;
      setRules((prev) =>
        isEdit ? (prev ?? []).map((r) => (r.id === saved.id ? saved : r)) : [...(prev ?? []), saved],
      );
      resetForm();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(rule: RecurringRule) {
    setBusyId(rule.id);
    try {
      const res = await fetch(`/api/recurring/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !rule.active }),
      });
      const data = await res.json();
      if (res.ok) {
        setRules((prev) => (prev ?? []).map((r) => (r.id === rule.id ? data.rule : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleSkip(rule: RecurringRule) {
    setBusyId(rule.id);
    try {
      const res = await fetch(`/api/recurring/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setRules((prev) => (prev ?? []).map((r) => (r.id === rule.id ? data.rule : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: number, move: "up" | "down") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move }),
      });
      const data = await res.json();
      if (res.ok) setRules(data.rules);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeleting(true);
    setBusyId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => (prev ?? []).filter((r) => r.id !== id));
        setConfirmDeleteId(null);
      }
    } finally {
      setBusyId(null);
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">{t("recurring.title")}</h3>
        <button
          onClick={() => (adding ? resetForm() : startAdd())}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? t("common.cancel") : t("recurring.addRule")}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        {t("recurring.desc")}
      </p>

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/recurring/export" importUrl="/api/recurring/import" onImported={refetch} />
      </div>

      {suggestions.filter((c) => !dismissedKeys.has(c.key)).length > 0 && (
        <div className="mt-4 rounded-card border border-dashed border-line bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">{t("recurring.suggestions.title")}</p>
          <p className="mt-1 text-[11px] leading-snug text-ink-soft">{t("recurring.suggestions.hint")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {suggestions
              .filter((c) => !dismissedKeys.has(c.key))
              .map((c) => (
                <div key={c.key} className="flex items-center gap-3 rounded-input border border-line px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.merchant}</p>
                    <p className="text-xs text-ink-soft">
                      {formatCurrency(c.amount, currency)} · {FREQUENCY_LABELS[c.frequency] ?? c.frequency} ·{" "}
                      {t("recurring.suggestions.seenTimes").replace("{count}", String(c.occurrenceCount))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedKeys((prev) => new Set(prev).add(c.key))}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                  >
                    {t("recurring.suggestions.dismiss")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(c)}
                    disabled={acceptingKey === c.key}
                    className="shrink-0 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                  >
                    {acceptingKey === c.key ? t("common.saving") : t("recurring.suggestions.add")}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {adding && (
        <form onSubmit={handleSubmitForm} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          {typeof formMode === "number" ? (
            <p className="text-sm font-semibold capitalize text-surface-foreground-soft">
              {t("recurring.editingRulePrefix")} {type === "expense" ? t("common.expense") : type === "income" ? t("common.income") : t("common.transfer")} {t("recurring.editingRuleSuffix")}
            </p>
          ) : (
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              {(["expense", "income", "transfer"] as TransactionType[]).map((tt) => (
                <button
                  key={tt}
                  type="button"
                  onClick={() => {
                    setType(tt);
                    const stillValid = allCategories.some((c) => c.type === tt && c.name === category);
                    if (!stillValid) setCategory("Other");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${
                    type === tt ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                  }`}
                >
                  {tt === "expense" ? t("common.expense") : tt === "income" ? t("common.income") : t("common.transfer")}
                </button>
              ))}
            </div>
          )}

          {type === "transfer" && typeof formMode !== "number" && (
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              <button
                type="button"
                onClick={() => setDirection("out")}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                  direction === "out" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                }`}
              >
                {t("form.moneyOut")}
              </button>
              <button
                type="button"
                onClick={() => setDirection("in")}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                  direction === "in" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                }`}
              >
                {t("form.moneyIn")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("form.amount")}</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("recurring.frequency")}</label>
              <SelectDropdown
                value={FREQUENCY_LABELS[frequency]}
                options={Object.values(FREQUENCY_LABELS)}
                onChange={(label) => {
                  const entry = Object.entries(FREQUENCY_LABELS).find(([, v]) => v === label);
                  if (entry) setFrequency(entry[0]);
                }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">
              {type === "income" ? t("form.source") : type === "transfer" ? t("form.description") : t("form.merchant")}
            </label>
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={type === "income" ? "e.g. Acme Corp" : "e.g. Rent"}
              className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("common.category")}</label>
              <SelectDropdown value={category} options={categories.map((c) => c.name)} onChange={setCategory} />
            </div>
            {wallets.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("common.wallet")}</label>
                <SelectDropdown
                  value={selectedWalletName}
                  options={wallets.map((w) => w.name)}
                  onChange={(name) => {
                    const wallet = wallets.find((w) => w.name === name);
                    if (wallet) setWalletId(wallet.id);
                  }}
                />
              </div>
            )}
          </div>

          {typeof formMode !== "number" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">{t("recurring.startsOn")}</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? t("common.saving") : typeof formMode === "number" ? t("form.saveChanges") : t("recurring.saveRule")}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {rules === null ? (
        <p className="mt-4 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : rules.length === 0 ? (
        <EmptyState text={t("recurring.noRulesYet")} />
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {rules.map((r, i) => {
            const ruleType: TransactionType = r.type === "income" || r.type === "transfer" ? r.type : "expense";
            const categoryColor = allCategories.find((c) => c.type === ruleType && c.name === r.category)?.color;
            const confirming = confirmDeleteId === r.id;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"} ${r.active ? "" : "opacity-60"}`}
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => handleMove(r.id, "up")}
                    disabled={busyId === r.id || i === 0}
                    aria-label="Move up"
                    className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M5 12l5-5 5 5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(r.id, "down")}
                    disabled={busyId === r.id || i === rules.length - 1}
                    aria-label="Move down"
                    className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M5 8l5 5 5-5" />
                    </svg>
                  </button>
                </div>

                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(categoryColor)}`}>
                  <RepeatIcon />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{r.merchant}</p>
                  <p className="text-xs text-ink-soft">
                    {formatCurrency(Number(r.amount), currency)} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency} · {t("recurring.next")}{" "}
                    {r.next_run_date}
                  </p>
                </div>

                {confirming ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deleting}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? t("common.deleting") : t("common.confirmDelete")}
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(r)}
                      aria-label={`Edit ${r.merchant}`}
                      className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                    >
                      <EditIcon />
                    </button>
                    {r.active && (
                      <button
                        onClick={() => handleSkip(r)}
                        disabled={busyId === r.id}
                        aria-label={`Skip next occurrence of ${r.merchant}`}
                        className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                      >
                        <SkipIcon />
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(r)}
                      disabled={busyId === r.id}
                      aria-label={r.active ? `Pause ${r.merchant}` : `Resume ${r.merchant}`}
                      className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                    >
                      {r.active ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={busyId === r.id}
                      aria-label={`Delete ${r.merchant}`}
                      className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
