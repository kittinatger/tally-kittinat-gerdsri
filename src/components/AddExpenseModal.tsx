"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { emptyExpenseFormValues, type ExpenseFormValues } from "./ExpenseForm";
import ReceiptDropzone from "./ReceiptDropzone";
import type { Expense } from "@/types/expense";
import { isTransactionType } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";

type Tab = "manual" | "scan";
type ScanStatus = "idle" | "analyzing" | "review" | "error";

export default function AddExpenseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (expense: Expense) => void;
}) {
  const allCategories = useAllCategories();
  const [tab, setTab] = useState<Tab>("manual");
  const [queue, setQueue] = useState<File[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanValues, setScanValues] = useState<ExpenseFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function processFile(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setScanStatus("analyzing");
    setScanError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setScanError(typeof data.error === "string" ? data.error : "Could not read that document.");
        setScanStatus("error");
        return;
      }
      const extraction = data.extraction as {
        type: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
      };
      const type = isTransactionType(extraction.type) ? extraction.type : "expense";
      const categoryValid = allCategories.some((c) => c.type === type && c.name === extraction.category);
      setScanValues({
        type,
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: categoryValid ? extraction.category : "Other",
        notes: "",
        tags: [],
      });
      setScanStatus("review");
    } catch {
      setScanError("Network error while reading the document.");
      setScanStatus("error");
    }
  }

  function handleFilesSelected(files: File[]) {
    setQueue(files);
    setQueueIndex(0);
    processFile(files[0]);
  }

  function advanceQueue() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanValues(null);
    setScanError(null);

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      processFile(queue[nextIndex]);
    } else {
      setQueue([]);
      setQueueIndex(0);
      setScanStatus("idle");
      onClose();
    }
  }

  async function handleManualSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const expense = await createExpense(values);
      onCreated(expense);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleScanSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const expense = await createExpense(values);
      onCreated(expense);
      advanceQueue();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Add transaction">
      <div className="mb-4 flex gap-1 rounded-full bg-bg-soft p-1">
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "manual" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Manual entry
        </button>
        <button
          onClick={() => setTab("scan")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "scan" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Scan document
        </button>
      </div>

      {tab === "manual" && (
        <ExpenseForm
          initialValues={emptyExpenseFormValues}
          submitLabel="Add transaction"
          onSubmit={handleManualSubmit}
          submitting={submitting}
          error={submitError}
        />
      )}

      {tab === "scan" && (
        <div>
          {scanStatus === "idle" && <ReceiptDropzone onFilesSelected={handleFilesSelected} />}

          {scanStatus === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Document preview" className="h-32 w-32 rounded-card object-cover" />
              )}
              <div className="flex items-center gap-2 text-sm font-semibold text-surface-foreground-soft">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface-accent border-t-transparent" />
                {queue.length > 1 ? `Reading document ${queueIndex + 1} of ${queue.length}...` : "Reading document..."}
              </div>
            </div>
          )}

          {scanStatus === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              {queue.length > 1 && (
                <p className="text-xs font-semibold text-surface-foreground-soft">
                  Document {queueIndex + 1} of {queue.length}
                </p>
              )}
              <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => processFile(queue[queueIndex])}
                  className="rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
                >
                  Retry
                </button>
                <button
                  onClick={advanceQueue}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                >
                  {queueIndex + 1 < queue.length ? "Skip" : "Close"}
                </button>
              </div>
            </div>
          )}

          {scanStatus === "review" && scanValues && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-card bg-surface-soft p-3">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Document preview" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  {queue.length > 1 && (
                    <p className="mb-1 text-xs font-semibold text-surface-accent">
                      Reviewing {queueIndex + 1} of {queue.length}
                    </p>
                  )}
                  <p className="text-xs text-surface-foreground-soft">
                    Review the details below before saving — the vision model detected whether this is an expense
                    or income and can occasionally get it wrong, so double-check the toggle too.
                  </p>
                </div>
              </div>
              <ExpenseForm
                key={queueIndex}
                initialValues={scanValues}
                submitLabel={queueIndex + 1 < queue.length ? "Save & next" : "Save transaction"}
                onSubmit={handleScanSubmit}
                onCancel={advanceQueue}
                submitting={submitting}
                error={submitError}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

async function createExpense(values: ExpenseFormValues): Promise<Expense> {
  const res = await fetch("/api/expenses", {
    method: "POST",
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
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that entry.");
  }
  return {
    id: data.expense.id,
    type: data.expense.type === "income" ? "income" : "expense",
    date: data.expense.date,
    amount: Number(data.expense.amount),
    merchant: data.expense.merchant,
    category: data.expense.category,
    notes: data.expense.notes,
    tags: data.expense.tags ?? [],
  };
}
