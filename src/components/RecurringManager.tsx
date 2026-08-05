"use client";

import { useEffect, useState } from "react";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import type { TransactionType, TransferDirection } from "@/lib/categories";
import SelectDropdown from "./SelectDropdown";

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
  const adding = formMode !== "closed";

  const [type, setType] = useState<TransactionType>("expense");
  const [direction, setDirection] = useState<TransferDirection>("out");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Other");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(todayInputValue());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/recurring")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRules(data.rules ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your recurring transactions.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    } catch {
      setError("Network error while saving.");
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

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => (prev ?? []).filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
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
        <p className="mt-4 text-sm text-ink-soft">No recurring transactions yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {rules.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i === rules.length - 1 ? "" : "border-b border-line"} ${r.active ? "" : "opacity-60"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.merchant}</p>
                <p className="text-xs text-ink-soft">
                  {formatCurrency(Number(r.amount), currency)} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency} · next{" "}
                  {r.next_run_date}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(r)}
                  className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(r)}
                  disabled={busyId === r.id}
                  className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                >
                  {r.active ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={busyId === r.id}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
