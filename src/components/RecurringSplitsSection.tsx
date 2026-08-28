"use client";

import { useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

type Friend = { id: number; username: string };

type RecurringSplitRow = {
  id: number;
  title: string;
  total_amount: string;
  split_method: string;
  participant_ids: number[];
  frequency: string;
  next_run_date: string;
  active: boolean;
};

const FREQUENCY_KEYS: Record<string, MessageKey> = {
  weekly: "recurring.weekly",
  monthly: "recurring.monthly",
  yearly: "recurring.yearly",
};

// A monthly-rent-style split that auto-regenerates a real split on
// schedule — a template only (see recurring_splits in lib/db.ts /
// processDueRecurringSplits, which materializes it into a real `splits`
// row via createSplit() the next time the dashboard loads on or after
// next_run_date). Equal-split/single-payer only, to keep the quick-add
// form here simple — a custom-amount or itemized recurring split can
// still be recreated by hand each time if needed.
export default function RecurringSplitsSection({ myId, friends }: { myId: number | null; friends: Friend[] }) {
  const t = useT();
  const currency = useCurrency();
  const FREQUENCY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(FREQUENCY_KEYS).map(([k, v]) => [k, t(v)]),
  );

  const [rows, setRows] = useState<RecurringSplitRow[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refetch() {
    fetch("/api/recurring-splits")
      .then((res) => res.json())
      .then((data) => setRows(data.rows ?? []))
      .catch(() => setRows([]));
  }

  useEffect(() => {
    refetch();
  }, []);

  function resetForm() {
    setFormOpen(false);
    setTitle("");
    setTotalAmount("");
    setParticipantIds([]);
    setFrequency("monthly");
    setStartDate(todayInputValue());
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (participantIds.length === 0) {
      setError(t("split.recurring.needParticipant"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/recurring-splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          totalAmount: Number(totalAmount),
          splitMethod: "equal",
          participantIds,
          frequency,
          startDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("split.recurring.saveFailed"));
        return;
      }
      setRows((prev) => [data.row, ...(prev ?? [])]);
      resetForm();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(row: RecurringSplitRow) {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/recurring-splits/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      if (res.ok) setRows((prev) => (prev ?? []).map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/recurring-splits/${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (friends.length === 0) return null; // nothing to split with yet

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{t("split.recurring.title")}</p>
        <button
          type="button"
          onClick={() => (formOpen ? resetForm() : setFormOpen(true))}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
        >
          {formOpen ? t("common.cancel") : t("split.recurring.add")}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("split.recurring.titlePlaceholder")}
            className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={t("form.amount")}
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
            >
              {Object.entries(FREQUENCY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            {friends.map((f) => {
              const selected = participantIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    setParticipantIds((prev) => (selected ? prev.filter((id) => id !== f.id) : [...prev, f.id]))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected ? "border-surface-accent bg-surface-accent/10 text-surface-accent" : "border-line text-ink-soft"
                  }`}
                >
                  {f.username}
                </button>
              );
            })}
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-end rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? t("common.saving") : t("split.recurring.save")}
          </button>
        </form>
      )}

      {rows && rows.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          {rows.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-input border border-line px-3 py-2 ${r.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{r.title}</p>
                <p className="text-[11px] text-ink-soft">
                  {formatCurrency(Number(r.total_amount), currency)} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency} ·{" "}
                  {t("recurring.next")} {r.next_run_date}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => toggleActive(r)}
                className="shrink-0 text-[11px] font-semibold text-ink-soft transition hover:text-foreground disabled:opacity-60"
              >
                {r.active ? t("recurring.pause") : t("recurring.resume")}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => handleDelete(r.id)}
                className="shrink-0 text-[11px] font-semibold text-red-600 transition hover:underline disabled:opacity-60 dark:text-red-400"
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
