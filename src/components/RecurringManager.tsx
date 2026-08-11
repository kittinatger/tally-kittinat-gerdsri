"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useCallback, useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import SelectDropdown from "./SelectDropdown";
import CsvManagerButtons from "./CsvManagerButtons";

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

const FREQUENCY_LABELS: Record<string, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

function RepeatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M4 7h9a2.5 2.5 0 0 1 2.5 2.5V11M16 13H7a2.5 2.5 0 0 1-2.5-2.5V9" />
      <path d="M6.5 4.5 4 7l2.5 2.5M13.5 15.5 16 13l-2.5-2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
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
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const currency = useCurrency();

  const [rules, setRules] = useState<RecurringRule[] | null>(null);
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
  }, [refetch]);

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
        <h3 className="font-display text-xl text-foreground">Recurring transactions</h3>
        <button
          onClick={() => (adding ? resetForm() : startAdd())}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? "Cancel" : "Add rule"}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        Rent, subscriptions, salary — logged automatically on the schedule you set, next time you open Tally on or
        after the due date.
      </p>

      <div className="mt-3">
        <CsvManagerButtons exportHref="/api/recurring/export" importUrl="/api/recurring/import" onImported={refetch} />
      </div>

      {adding && (
        <form onSubmit={handleSubmitForm} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          {typeof formMode === "number" ? (
            <p className="text-sm font-semibold capitalize text-surface-foreground-soft">
              Editing {type} rule — type can&apos;t be changed; delete and re-add to change it.
            </p>
          ) : (
            <div className="flex gap-1 rounded-full bg-bg-soft p-1">
              {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    const stillValid = allCategories.some((c) => c.type === t && c.name === category);
                    if (!stillValid) setCategory("Other");
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${
                    type === t ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                  }`}
                >
                  {t}
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
                Money out
              </button>
              <button
                type="button"
                onClick={() => setDirection("in")}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                  direction === "in" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                }`}
              >
                Money in
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Amount</label>
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
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Frequency</label>
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
              {type === "income" ? "Source" : type === "transfer" ? "Description" : "Merchant"}
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
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Category</label>
              <SelectDropdown value={category} options={categories.map((c) => c.name)} onChange={setCategory} />
            </div>
            {wallets.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Wallet</label>
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
              <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">Starts on</label>
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
              {submitting ? "Saving..." : typeof formMode === "number" ? "Save changes" : "Save rule"}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {rules === null ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : rules.length === 0 ? (
        <EmptyState text="No recurring transactions yet — add one above to have it logged automatically." />
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
                    {formatCurrency(Number(r.amount), currency)} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency} · next{" "}
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
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? "Deleting..." : "Confirm delete"}
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
