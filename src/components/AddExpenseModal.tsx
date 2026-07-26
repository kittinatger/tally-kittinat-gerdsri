"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { emptyExpenseFormValues, type ExpenseFormValues } from "./ExpenseForm";
import ReceiptDropzone from "./ReceiptDropzone";
import type { Expense } from "@/types/expense";
import { isCategory, type TransactionType } from "@/lib/categories";

type Tab = "manual" | "scan";
type ScanStatus = "idle" | "analyzing" | "review" | "error";

export default function AddExpenseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (expense: Expense) => void;
}) {
  const [tab, setTab] = useState<Tab>("manual");
  const [scanType, setScanType] = useState<TransactionType>("expense");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanValues, setScanValues] = useState<ExpenseFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setScanStatus("analyzing");
    setScanError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", scanType);

    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setScanError(typeof data.error === "string" ? data.error : "Could not read that document.");
        setScanStatus("error");
        return;
      }
      const extraction = data.extraction as { merchant: string; amount: number; date: string; category: string };
      setScanValues({
        type: scanType,
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: isCategory(scanType, extraction.category) ? extraction.category : "Other",
        notes: "",
      });
      setScanStatus("review");
    } catch {
      setScanError("Network error while reading the document.");
      setScanStatus("error");
    }
  }

  function resetScan() {
    setScanStatus("idle");
    setScanError(null);
    setScanValues(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  async function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(typeof data.error === "string" ? data.error : "Could not save that entry.");
        return;
      }
      onCreated({
        id: data.expense.id,
        type: data.expense.type === "income" ? "income" : "expense",
        date: data.expense.date,
        amount: Number(data.expense.amount),
        merchant: data.expense.merchant,
        category: data.expense.category,
        notes: data.expense.notes,
      });
    } catch {
      setSubmitError("Network error while saving.");
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
            tab === "manual" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
          }`}
        >
          Manual entry
        </button>
        <button
          onClick={() => setTab("scan")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "scan" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
          }`}
        >
          Scan document
        </button>
      </div>

      {tab === "manual" && (
        <ExpenseForm
          initialValues={emptyExpenseFormValues}
          submitLabel="Add transaction"
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      )}

      {tab === "scan" && (
        <div>
          {scanStatus === "idle" && (
            <>
              <div className="mb-4 flex gap-1 rounded-full bg-bg-soft p-1">
                <button
                  onClick={() => setScanType("expense")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                    scanType === "expense" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                  }`}
                >
                  Expense receipt
                </button>
                <button
                  onClick={() => setScanType("income")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                    scanType === "income" ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
                  }`}
                >
                  Income document
                </button>
              </div>
              <ReceiptDropzone onFileSelected={handleFileSelected} />
            </>
          )}

          {scanStatus === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Document preview" className="h-32 w-32 rounded-card object-cover" />
              )}
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                Reading document...
              </div>
            </div>
          )}

          {scanStatus === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
              <button
                onClick={resetScan}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
              >
                Try another photo
              </button>
            </div>
          )}

          {scanStatus === "review" && scanValues && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-card bg-bg-soft p-3">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Document preview" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <p className="text-xs text-ink-soft">
                  Review the details below before saving — the vision model can occasionally misread documents.
                </p>
              </div>
              <ExpenseForm
                initialValues={scanValues}
                submitLabel="Save transaction"
                onSubmit={handleSubmit}
                onCancel={resetScan}
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
