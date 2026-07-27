"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { type ExpenseFormValues } from "./ExpenseForm";
import type { Expense } from "@/types/expense";

export default function EditExpenseModal({
  expense,
  onClose,
  onUpdated,
  onDeleted,
}: {
  expense: Expense;
  onClose: () => void;
  onUpdated: (expense: Expense) => void;
  onDeleted: (id: number) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initialValues: ExpenseFormValues = {
    type: expense.type,
    date: expense.date,
    amount: String(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    notes: expense.notes ?? "",
    tags: expense.tags,
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
          date: values.date,
          amount: Number(values.amount),
          merchant: values.merchant,
          category: values.category,
          notes: values.notes || undefined,
          tags: values.tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save changes.");
        return;
      }
      onUpdated({
        id: data.expense.id,
        type: data.expense.type === "income" ? "income" : "expense",
        date: data.expense.date,
        amount: Number(data.expense.amount),
        merchant: data.expense.merchant,
        category: data.expense.category,
        notes: data.expense.notes,
        tags: data.expense.tags ?? [],
        hasReceipt: expense.hasReceipt,
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
      <ExpenseForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitting={submitting}
        error={error}
        footerLeft={
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
        }
      />
    </Modal>
  );
}
