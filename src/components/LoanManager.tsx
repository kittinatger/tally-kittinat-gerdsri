"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { PlusIcon, TrashIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { LoanDirection } from "@/lib/loans";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";

type Loan = {
  id: number;
  counterparty_friend_id: number | null;
  counterparty_name: string | null;
  counterparty_username: string | null;
  direction: LoanDirection;
  principal: string;
  notes: string | null;
  paid_total: string;
  installment_count: number;
  paid_count: number;
};

type Installment = { id: number; due_date: string; amount: string; paid: boolean };
type Friend = { id: number; username: string };

function counterpartyLabel(loan: Loan): string {
  return loan.counterparty_username ?? loan.counterparty_name ?? "—";
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function LoanManager() {
  const t = useT();
  const currency = useCurrency();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [installmentsByLoan, setInstallmentsByLoan] = useState<Record<number, Installment[]>>({});

  // Add-form state
  const [friendId, setFriendId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<LoanDirection>("lent");
  const [principal, setPrincipal] = useState("");
  const [notes, setNotes] = useState("");
  const [installmentRows, setInstallmentRows] = useState<{ dueDate: string; amount: string }[]>([
    { dueDate: todayInputValue(), amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadLoans();
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.friends)) setFriends(data.friends);
      })
      .catch(() => {
        // Leave empty — the counterparty-name field still works.
      });
  }, []);

  async function loadLoans() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      if (!res.ok) throw new Error("Could not load loans.");
      setLoans(data.loans ?? []);
    } catch (err) {
      setError(describeFetchError(err, "Load loans"));
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(loan: Loan) {
    if (expandedId === loan.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(loan.id);
    if (!installmentsByLoan[loan.id]) {
      const res = await fetch(`/api/loans/${loan.id}`);
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.installments)) {
        setInstallmentsByLoan((prev) => ({ ...prev, [loan.id]: data.installments }));
      }
    }
  }

  async function toggleInstallment(loanId: number, installmentId: number) {
    setInstallmentsByLoan((prev) => ({
      ...prev,
      [loanId]: (prev[loanId] ?? []).map((i) => (i.id === installmentId ? { ...i, paid: !i.paid } : i)),
    }));
    await mutateFetch(`/api/loans/installments/${installmentId}`, { method: "PATCH" });
    loadLoans();
  }

  async function handleDelete(loanId: number) {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
    await mutateFetch(`/api/loans/${loanId}`, { method: "DELETE" });
  }

  function addInstallmentRow() {
    setInstallmentRows((prev) => [...prev, { dueDate: todayInputValue(), amount: "" }]);
  }

  function removeInstallmentRow(index: number) {
    setInstallmentRows((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFriendId("");
    setName("");
    setDirection("lent");
    setPrincipal("");
    setNotes("");
    setInstallmentRows([{ dueDate: todayInputValue(), amount: "" }]);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await mutateFetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterpartyFriendId: friendId === "" ? null : friendId,
          counterpartyName: friendId === "" ? name.trim() || null : null,
          direction,
          principal: Number(principal),
          notes: notes.trim() || null,
          installments: installmentRows.filter((r) => r.amount).map((r) => ({ dueDate: r.dueDate, amount: Number(r.amount) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(typeof data.error === "string" ? data.error : "Could not save that loan.");
        return;
      }
      resetForm();
      setShowAddForm(false);
      loadLoans();
    } catch (err) {
      setFormError(describeFetchError(err, "Add loan"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">{t("loans.title")}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">{t("loans.description")}</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={t("loans.addLoan")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <PlusIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div className="flex gap-1 rounded-full bg-bg-soft p-1">
            <button
              type="button"
              onClick={() => setDirection("lent")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${direction === "lent" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"}`}
            >
              {t("loans.iLent")}
            </button>
            <button
              type="button"
              onClick={() => setDirection("borrowed")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${direction === "borrowed" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"}`}
            >
              {t("loans.iBorrowed")}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loans.counterparty")}</label>
            <select
              value={friendId}
              onChange={(e) => setFriendId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              <option value="">{t("loans.someoneNotOnTally")}</option>
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.username}
                </option>
              ))}
            </select>
            {friendId === "" && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("loans.namePlaceholder")}
                className="mt-2 w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loans.principal")}</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("loans.schedule")}</label>
            <div className="space-y-2">
              {installmentRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={row.dueDate}
                    onChange={(e) =>
                      setInstallmentRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, dueDate: e.target.value } : r)))
                    }
                    className="flex-1 rounded-card border border-line bg-bg-soft px-3 py-2 text-sm text-foreground outline-none focus:border-navy"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("loans.amount")}
                    value={row.amount}
                    onChange={(e) =>
                      setInstallmentRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)))
                    }
                    className="w-28 rounded-card border border-line bg-bg-soft px-3 py-2 text-sm text-foreground outline-none focus:border-navy"
                  />
                  {installmentRows.length > 1 && (
                    <button type="button" onClick={() => removeInstallmentRow(i)} className="p-1.5 text-ink-soft hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addInstallmentRow} className="text-xs font-semibold text-navy hover:underline dark:text-blue-300">
                {t("loans.addInstallment")}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("membership.notesLabel")}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? t("common.saving") : t("loans.addLoan")}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink-soft">{t("common.loading")}</p>
        ) : loans.length === 0 ? (
          <EmptyState text={t("loans.empty")} />
        ) : (
          <div className="space-y-2">
            {loans.map((loan) => {
              const remaining = Number(loan.principal) - Number(loan.paid_total);
              return (
                <div key={loan.id} className="overflow-hidden rounded-card border border-line bg-surface">
                  <button type="button" onClick={() => toggleExpand(loan)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        loan.direction === "lent" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {counterpartyLabel(loan).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{counterpartyLabel(loan)}</p>
                      <p className="text-xs text-ink-soft">
                        {loan.direction === "lent" ? t("loans.youLent") : t("loans.youBorrowed")} {formatCurrency(Number(loan.principal), currency)}
                        {loan.installment_count > 0 ? ` · ${loan.paid_count}/${loan.installment_count}` : ""}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-semibold ${remaining > 0.004 ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {remaining > 0.004 ? formatCurrency(remaining, currency) : t("loans.paidOff")}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(loan.id);
                      }}
                      aria-label={t("loans.deleteLoan")}
                      className="rounded-full p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </button>
                  {expandedId === loan.id && (
                    <div className="border-t border-line px-4 py-3">
                      {loan.notes && <p className="mb-2 text-xs text-ink-soft">{loan.notes}</p>}
                      {(installmentsByLoan[loan.id] ?? []).length === 0 ? (
                        <p className="text-xs text-ink-soft">{t("loans.noSchedule")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(installmentsByLoan[loan.id] ?? []).map((inst) => (
                            <label key={inst.id} className="flex items-center gap-2.5 text-sm">
                              <input
                                type="checkbox"
                                checked={inst.paid}
                                onChange={() => toggleInstallment(loan.id, inst.id)}
                                className="h-4 w-4 rounded border-line accent-navy"
                              />
                              <span className={inst.paid ? "text-ink-soft line-through" : "text-foreground"}>{inst.due_date}</span>
                              <span className={`ml-auto ${inst.paid ? "text-ink-soft line-through" : "text-foreground"}`}>
                                {formatCurrency(Number(inst.amount), currency)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
