"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { emptyExpenseFormValues, type ExpenseFormValues } from "./ExpenseForm";
import ReceiptDropzone from "./ReceiptDropzone";
import type { Expense } from "@/types/expense";
import { isCategory, type Category } from "@/lib/categories";

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

    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setScanError(typeof data.error === "string" ? data.error : "Could not read that receipt.");
        setScanStatus("error");
        return;
      }
      const extraction = data.extraction as { merchant: string; amount: number; date: string; category: string };
      setScanValues({
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: isCategory(extraction.category) ? (extraction.category as Category) : "Other",
        notes: "",
      });
      setScanStatus("review");
    } catch {
      setScanError("Network error while reading the receipt.");
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
          date: values.date,
          amount: Number(values.amount),
          merchant: values.merchant,
          category: values.category,
          notes: values.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(typeof data.error === "string" ? data.error : "Could not save that expense.");
        return;
      }
      onCreated({
        id: data.expense.id,
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
    <Modal onClose={onClose} title="Add expense">
      <div className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === "manual"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          Manual entry
        </button>
        <button
          onClick={() => setTab("scan")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === "scan"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          Scan receipt
        </button>
      </div>

      {tab === "manual" && (
        <ExpenseForm
          initialValues={emptyExpenseFormValues}
          submitLabel="Add expense"
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      )}

      {tab === "scan" && (
        <div>
          {scanStatus === "idle" && <ReceiptDropzone onFileSelected={handleFileSelected} />}

          {scanStatus === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Receipt preview" className="h-32 w-32 rounded-xl object-cover" />
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                Reading receipt...
              </div>
            </div>
          )}

          {scanStatus === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
              <button
                onClick={resetScan}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Try another photo
              </button>
            </div>
          )}

          {scanStatus === "review" && scanValues && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Receipt preview" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Review the details below before saving — the vision model can occasionally misread receipts.
                </p>
              </div>
              <ExpenseForm
                initialValues={scanValues}
                submitLabel="Save expense"
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
