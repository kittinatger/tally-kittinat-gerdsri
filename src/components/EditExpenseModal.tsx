"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { type ExpenseFormValues } from "./ExpenseForm";
import type { Expense } from "@/types/expense";
import type { Category } from "@/lib/categories";

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
    date: expense.date,
    amount: String(expense.amount),
    merchant: expense.merchant,
    category: expense.category as Category,
    notes: expense.notes ?? "",
  };

  async function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date,
          amount: Number(values.amount),
          merchant: values.merchant,
          category: values.category,
          notes: values.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save changes.");
        return;
      }
      onUpdated({
        id: data.expense.id,
        date: data.expense.date,
        amount: Number(data.expense.amount),
        merchant: data.expense.merchant,
        category: data.expense.category,
        notes: data.expense.notes,
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
    <Modal onClose={onClose} title="Edit expense">
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
