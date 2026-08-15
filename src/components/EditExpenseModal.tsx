"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { logAppError } from "@/lib/error-log";
import { useRef, useState } from "react";
import { useT } from "@/lib/language-context";
import Modal from "./Modal";
import ReceiptLightbox from "./ReceiptLightbox";
import ExpenseForm, { type ExpenseFormValues } from "./ExpenseForm";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { todayInputValue } from "@/lib/format";
import { downscaleImage } from "@/lib/image-downscale";

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5" />
    </svg>
  );
}

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
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const receiptUrl = `/api/expenses/${expense.id}/receipt`;

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
    } catch (err) {
      setError(describeFetchError(err, "Edit transaction"));
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
    } catch (err) {
      setError(describeFetchError(err, "Delete transaction"));
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
      formData.append("image", await downscaleImage(file));
      const res = await fetch(`/api/expenses/${expense.id}/receipt`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = typeof data?.error === "string" ? data.error : "Could not attach that image.";
        setAttachError(message);
        logAppError("Attach receipt", message);
        return;
      }
      onUpdated({ ...expense, hasReceipt: true });
    } catch (err) {
      setAttachError(describeFetchError(err, "Attach receipt"));
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
    } catch (err) {
      setError(describeFetchError(err, "Duplicate transaction"));
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <Modal onClose={onClose} title={t("modal.editTransaction")} wide>
      {expense.hasReceipt && (
        <button
          type="button"
          onClick={() => setViewingReceipt(true)}
          className="mb-4 flex w-full items-center gap-3 rounded-card border border-amber-200/70 bg-gradient-to-br from-amber-50 via-surface-soft to-surface-soft p-3 text-left transition hover:border-amber-400 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-surface-soft dark:to-surface-soft"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={receiptUrl} alt="Receipt" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-surface-foreground">
            <ReceiptIcon />
            {t("activities.viewReceipt")}
          </span>
        </button>
      )}

      {viewingReceipt && <ReceiptLightbox src={receiptUrl} onClose={() => setViewingReceipt(false)} />}
      {!expense.hasReceipt && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            disabled={attaching}
            className="flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-400 disabled:opacity-60 dark:border-amber-900/50 dark:text-amber-400"
          >
            <ReceiptIcon />
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
        submitLabel={t("form.saveChanges")}
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
              aria-label="Duplicate transaction"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-60"
            >
              <CopyIcon />
              <span className="hidden sm:inline">{duplicating ? "Duplicating..." : "Duplicate"}</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={confirmingDelete ? "Confirm delete" : "Delete transaction"}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                confirmingDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              }`}
            >
              <TrashIcon />
              <span className={confirmingDelete ? "inline" : "hidden sm:inline"}>
                {deleting ? t("common.deleting") : confirmingDelete ? t("common.confirmDelete") : t("common.delete")}
              </span>
            </button>
          </div>
        }
      />
    </Modal>
  );
}
