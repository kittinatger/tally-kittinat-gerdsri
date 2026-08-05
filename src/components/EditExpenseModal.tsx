"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { type ExpenseFormValues } from "./ExpenseForm";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { todayInputValue } from "@/lib/format";

export default function EditExpenseModal({
  expense,
  onClose,
  onUpdated,
  onDeleted,
  onDuplicated,
}: {
  expense: Expense;
  onClose: () => void;
  onUpdated: (expense: Expense) => void;
  onDeleted: (id: number) => void;
  onDuplicated?: (expense: Expense) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const initialValues: ExpenseFormValues = {
    type: expense.type,
    direction: expense.direction ?? "out",
    date: expense.date,
    amount: String(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    notes: expense.notes ?? "",
    tags: expense.tags,
    walletId: expense.walletId,
  };

  async function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: values.type,
          direction: values.type === "transfer" ? values.direction : undefined,
          date: values.date,
          amount: Number(values.amount),
          merchant: values.merchant,
          category: values.category,
          notes: values.notes || undefined,
          tags: values.tags,
          walletId: values.walletId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save changes.");
        return;
      }
      onUpdated({
        id: data.expense.id,
        type: normalizeExpenseType(data.expense.type),
        direction: normalizeDirection(data.expense.direction),
        date: data.expense.date,
        amount: Number(data.expense.amount),
        merchant: data.expense.merchant,
        category: data.expense.category,
        notes: data.expense.notes,
        tags: data.expense.tags ?? [],
        hasReceipt: expense.hasReceipt,
        walletId: data.expense.wallet_id ?? null,
        walletName: data.expense.wallet_name ?? null,
        splitGroupId: data.expense.split_group_id ?? null,
      });
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted(expense.id);
        return;
      }
      setError("Could not delete this expense.");
      setConfirmingDelete(false);
    } catch {
      setError("Network error while deleting.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAttachReceipt(file: File) {
    setAttaching(true);
    setAttachError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/expenses/${expense.id}/receipt`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setAttachError(typeof data?.error === "string" ? data.error : "Could not attach that image.");
        return;
      }
      onUpdated({ ...expense, hasReceipt: true });
    } catch {
      setAttachError("Network error while uploading.");
    } finally {
      setAttaching(false);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: expense.type,
          direction: expense.type === "transfer" ? (expense.direction ?? "out") : undefined,
          date: todayInputValue(),
          amount: expense.amount,
          merchant: expense.merchant,
          category: expense.category,
          notes: expense.notes || undefined,
          tags: expense.tags,
          walletId: expense.walletId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not duplicate this transaction.");
        return;
      }
      onDuplicated?.({
        id: data.expense.id,
        type: normalizeExpenseType(data.expense.type),
        direction: normalizeDirection(data.expense.direction),
        date: data.expense.date,
        amount: Number(data.expense.amount),
        merchant: data.expense.merchant,
        category: data.expense.category,
        notes: data.expense.notes,
        tags: data.expense.tags ?? [],
        hasReceipt: false,
        walletId: data.expense.wallet_id ?? null,
        walletName: data.expense.wallet_name ?? null,
        splitGroupId: data.expense.split_group_id ?? null,
      });
      onClose();
    } catch {
      setError("Network error while duplicating.");
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Edit transaction">
      {expense.hasReceipt && (
        <a
          href={`/api/expenses/${expense.id}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-card bg-surface-soft p-3 transition hover:bg-[var(--surface-nav-hover)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/expenses/${expense.id}/receipt`}
            alt="Receipt"
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <span className="text-sm font-semibold text-surface-foreground">View original receipt</span>
        </a>
      )}
      {!expense.hasReceipt && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            disabled={attaching}
            className="flex items-center gap-2 rounded-full border border-surface-line px-3.5 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-60"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect x="2.5" y="4" width="15" height="12" rx="2" />
              <circle cx="10" cy="10" r="2.5" />
            </svg>
            {attaching ? "Attaching..." : "Attach receipt"}
          </button>
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAttachReceipt(file);
            }}
          />
          {attachError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{attachError}</p>}
        </div>
      )}
      <ExpenseForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitting={submitting}
        error={error}
        footerLeft={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-60"
            >
              {duplicating ? "Duplicating..." : "Duplicate"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                confirmingDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              }`}
            >
              {deleting ? "Deleting..." : confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          </div>
        }
      />
    </Modal>
  );
}
