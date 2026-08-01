"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { emptyExpenseFormValues, type ExpenseFormValues } from "./ExpenseForm";
import ReceiptDropzone from "./ReceiptDropzone";
import VoiceRecorder from "./VoiceRecorder";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType, isTransferDirection, type TransactionType } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";

type Tab = "manual" | "scan" | "voice";
type ScanStatus = "idle" | "analyzing" | "review" | "error";
type ConversionInfo = { originalAmount: number; originalCurrency: string };

export default function AddExpenseModal({
  onClose,
  onCreated,
  initialType = "expense",
}: {
  onClose: () => void;
  onCreated: (expense: Expense) => void;
  initialType?: TransactionType;
}) {
  const allCategories = useAllCategories();
  const currency = useCurrency();
  const [tab, setTab] = useState<Tab>("manual");
  const [queue, setQueue] = useState<File[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanValues, setScanValues] = useState<ExpenseFormValues | null>(null);
  const [scanConversion, setScanConversion] = useState<ConversionInfo | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<ScanStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceValues, setVoiceValues] = useState<ExpenseFormValues | null>(null);
  const [voiceConversion, setVoiceConversion] = useState<ConversionInfo | null>(null);
  const [lastRecording, setLastRecording] = useState<{ blob: Blob; mimeType: string } | null>(null);
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
        direction?: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
        originalAmount?: number;
        originalCurrency?: string;
      };
      const type = isTransactionType(extraction.type) ? extraction.type : "expense";
      const direction = extraction.direction && isTransferDirection(extraction.direction) ? extraction.direction : "out";
      const categoryValid = allCategories.some((c) => c.type === type && c.name === extraction.category);
      setScanValues({
        type,
        direction,
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: categoryValid ? extraction.category : "Other",
        notes: "",
        tags: [],
        walletId: null,
      });
      setScanConversion(
        extraction.originalAmount !== undefined && extraction.originalCurrency
          ? { originalAmount: extraction.originalAmount, originalCurrency: extraction.originalCurrency }
          : null,
      );
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

  async function processVoice(blob: Blob, mimeType: string) {
    setLastRecording({ blob, mimeType });
    setVoiceStatus("analyzing");
    setVoiceError(null);

    const formData = new FormData();
    formData.append("audio", blob, `recording.${mimeType.split("/")[1]?.split(";")[0] ?? "webm"}`);

    try {
      const res = await fetch("/api/extract-voice", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setVoiceError(typeof data.error === "string" ? data.error : "Could not understand that recording.");
        setVoiceStatus("error");
        return;
      }
      const extraction = data.extraction as {
        type: string;
        direction?: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
        notes?: string;
        originalAmount?: number;
        originalCurrency?: string;
      };
      const type = isTransactionType(extraction.type) ? extraction.type : "expense";
      const direction = extraction.direction && isTransferDirection(extraction.direction) ? extraction.direction : "out";
      const categoryValid = allCategories.some((c) => c.type === type && c.name === extraction.category);
      setVoiceValues({
        type,
        direction,
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: categoryValid ? extraction.category : "Other",
        notes: extraction.notes ?? "",
        tags: [],
        walletId: null,
      });
      setVoiceConversion(
        extraction.originalAmount !== undefined && extraction.originalCurrency
          ? { originalAmount: extraction.originalAmount, originalCurrency: extraction.originalCurrency }
          : null,
      );
      setVoiceStatus("review");
    } catch {
      setVoiceError("Network error while reading the recording.");
      setVoiceStatus("error");
    }
  }

  function resetVoice() {
    setVoiceStatus("idle");
    setVoiceError(null);
    setVoiceValues(null);
    setVoiceConversion(null);
    setLastRecording(null);
  }

  function advanceQueue() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanValues(null);
    setScanConversion(null);
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
      const file = queue[queueIndex];
      let hasReceipt = false;
      if (file) {
        try {
          const receiptData = new FormData();
          receiptData.append("image", file);
          const receiptRes = await fetch(`/api/expenses/${expense.id}/receipt`, {
            method: "POST",
            body: receiptData,
          });
          hasReceipt = receiptRes.ok;
        } catch {
          // Best-effort: the transaction is already saved even if the receipt image fails to attach.
        }
      }
      onCreated({ ...expense, hasReceipt });
      advanceQueue();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoiceSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const expense = await createExpense(values);
      onCreated(expense);
      resetVoice();
      onClose();
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
        <button
          onClick={() => setTab("voice")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            tab === "voice" ? "bg-surface-soft text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
          }`}
        >
          Speak
        </button>
      </div>

      {tab === "manual" && (
        <ExpenseForm
          initialValues={{ ...emptyExpenseFormValues, type: initialType }}
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
              {scanConversion && (
                <p className="mb-4 rounded-card bg-surface-soft px-3 py-2 text-xs font-medium text-surface-accent">
                  Converted from {formatCurrency(scanConversion.originalAmount, scanConversion.originalCurrency)} to{" "}
                  {currency}.
                </p>
              )}
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

      {tab === "voice" && (
        <div>
          {voiceStatus === "idle" && <VoiceRecorder onRecorded={processVoice} />}

          {voiceStatus === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-surface-foreground-soft">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface-accent border-t-transparent" />
                Listening...
              </div>
            </div>
          )}

          {voiceStatus === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{voiceError}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => lastRecording && processVoice(lastRecording.blob, lastRecording.mimeType)}
                  className="rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
                >
                  Retry
                </button>
                <button
                  onClick={resetVoice}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                >
                  Record again
                </button>
              </div>
            </div>
          )}

          {voiceStatus === "review" && voiceValues && (
            <div>
              <div className="mb-4 rounded-card bg-surface-soft p-3">
                <p className="text-xs text-surface-foreground-soft">
                  Review the details below before saving — double-check the amount and expense/income toggle, since
                  spoken numbers can occasionally be misheard.
                </p>
              </div>
              {voiceConversion && (
                <p className="mb-4 rounded-card bg-surface-soft px-3 py-2 text-xs font-medium text-surface-accent">
                  Converted from {formatCurrency(voiceConversion.originalAmount, voiceConversion.originalCurrency)} to{" "}
                  {currency}.
                </p>
              )}
              <ExpenseForm
                initialValues={voiceValues}
                submitLabel="Save transaction"
                onSubmit={handleVoiceSubmit}
                onCancel={resetVoice}
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
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that entry.");
  }
  return {
    id: data.expense.id,
    type: normalizeExpenseType(data.expense.type),
    direction: normalizeDirection(data.expense.direction),
    date: data.expense.date,
    amount: Number(data.expense.amount),
    merchant: data.expense.merchant,
    category: data.expense.category,
    notes: data.expense.notes,
    tags: data.expense.tags ?? [],
    hasReceipt: data.expense.has_receipt ?? false,
    walletId: data.expense.wallet_id ?? null,
    walletName: data.expense.wallet_name ?? null,
  };
}
