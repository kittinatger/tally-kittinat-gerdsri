"use client";

import { useState } from "react";
import Modal from "./Modal";
import ExpenseForm, { emptyExpenseFormValues, type ExpenseFormValues } from "./ExpenseForm";
import ReceiptDropzone from "./ReceiptDropzone";
import VoiceRecorder from "./VoiceRecorder";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import { isTransactionType, isTransferDirection, type TransactionType } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { downscaleImage } from "@/lib/image-downscale";
import { describeFetchError } from "@/lib/fetch-error";
import { logAppError } from "@/lib/error-log";
import { useT } from "@/lib/language-context";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";

type Tab = "manual" | "scan" | "voice";
type ScanStatus = "idle" | "analyzing" | "review" | "error";
type ConversionInfo = { originalAmount: number; originalCurrency: string };

function PencilTabIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M13.5 3.5a1.5 1.5 0 0 1 2 2l-8.5 8.5-3 1 1-3Z" />
    </svg>
  );
}

function ScanTabIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M4 6.5V5a1 1 0 0 1 1-1h1.5M14.5 4H16a1 1 0 0 1 1 1v1.5M17 13.5V15a1 1 0 0 1-1 1h-1.5M5.5 16H4a1 1 0 0 1-1-1v-1.5M3 10h14" />
    </svg>
  );
}

function MicTabIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
    </svg>
  );
}

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
  const wallets = useWallets();
  const currency = useCurrency();
  const t = useT();
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
  const [voiceQueue, setVoiceQueue] = useState<{ values: ExpenseFormValues; conversion: ConversionInfo | null }[]>([]);
  const [voiceQueueIndex, setVoiceQueueIndex] = useState(0);
  const [lastRecording, setLastRecording] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    values: ExpenseFormValues;
    duplicate: { id: number; date: string; amount: string; merchant: string };
  } | null>(null);

  async function processFile(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setScanStatus("analyzing");
    setScanError(null);

    // Downscales/re-encodes to JPEG client-side before it ever leaves the
    // browser — shrinks typical camera photos considerably (less to upload,
    // less stored per receipt) and, as a side effect, normalizes formats
    // like HEIC that some environments reject when sent on to Gemini.
    const uploadFile = await downscaleImage(file);
    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("fallbackDate", todayInputValue());

    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Could not read that document.";
        setScanError(message);
        setScanStatus("error");
        logAppError("Scan document", message);
        return;
      }
      const extraction = data.extraction as {
        type: string;
        direction?: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
        wallet?: string;
        originalAmount?: number;
        originalCurrency?: string;
      };
      const type = isTransactionType(extraction.type) ? extraction.type : "expense";
      const direction = extraction.direction && isTransferDirection(extraction.direction) ? extraction.direction : "out";
      const categoryValid = allCategories.some((c) => c.type === type && c.name === extraction.category);
      const matchedWallet = wallets.find((w) => w.name === extraction.wallet);
      setScanValues({
        type,
        direction,
        date: extraction.date,
        amount: String(extraction.amount),
        merchant: extraction.merchant,
        category: categoryValid ? extraction.category : "Other",
        notes: "",
        tags: [],
        walletId: matchedWallet?.id ?? null,
      });
      setScanConversion(
        extraction.originalAmount !== undefined && extraction.originalCurrency
          ? { originalAmount: extraction.originalAmount, originalCurrency: extraction.originalCurrency }
          : null,
      );
      setScanStatus("review");
    } catch (err) {
      setScanError(describeFetchError(err, "Scan document"));
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
    formData.append("fallbackDate", todayInputValue());

    try {
      const res = await fetch("/api/extract-voice", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Could not understand that recording.";
        setVoiceError(message);
        setVoiceStatus("error");
        logAppError("Voice entry", message);
        return;
      }
      const extractions = data.extractions as {
        type: string;
        direction?: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
        notes?: string;
        wallet?: string;
        originalAmount?: number;
        originalCurrency?: string;
      }[];
      setVoiceQueue(
        extractions.map((extraction) => {
          const type = isTransactionType(extraction.type) ? extraction.type : "expense";
          const direction =
            extraction.direction && isTransferDirection(extraction.direction) ? extraction.direction : "out";
          const categoryValid = allCategories.some((c) => c.type === type && c.name === extraction.category);
          const matchedWallet = wallets.find((w) => w.name === extraction.wallet);
          return {
            values: {
              type,
              direction,
              date: extraction.date,
              amount: String(extraction.amount),
              merchant: extraction.merchant,
              category: categoryValid ? extraction.category : "Other",
              notes: extraction.notes ?? "",
              tags: [],
              walletId: matchedWallet?.id ?? null,
            },
            conversion:
              extraction.originalAmount !== undefined && extraction.originalCurrency
                ? { originalAmount: extraction.originalAmount, originalCurrency: extraction.originalCurrency }
                : null,
          };
        }),
      );
      setVoiceQueueIndex(0);
      setVoiceStatus("review");
    } catch (err) {
      setVoiceError(describeFetchError(err, "Voice entry"));
      setVoiceStatus("error");
    }
  }

  function resetVoice() {
    setVoiceStatus("idle");
    setVoiceError(null);
    setVoiceQueue([]);
    setVoiceQueueIndex(0);
    setLastRecording(null);
  }

  function advanceVoiceQueue() {
    const nextIndex = voiceQueueIndex + 1;
    if (nextIndex < voiceQueue.length) {
      setVoiceQueueIndex(nextIndex);
    } else {
      resetVoice();
      onClose();
    }
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

  async function maybeSplitWithFriends(values: ExpenseFormValues, totalAmount: number) {
    if (!values.splitWithFriends || values.splitWithFriends.participantIds.length === 0) return;
    try {
      await createSplitFromExpense(totalAmount, values.merchant, values.date, values.splitWithFriends);
    } catch (err) {
      // Best-effort: the transaction is already saved even if the split-with-friends record fails to create.
      logAppError("Split with friends", err instanceof Error ? err.message : "Could not create the split with friends.");
    }
  }

  async function handleManualSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (values.splitLines && values.splitLines.length > 0) {
        const expenses = await createSplitExpense(values);
        expenses.forEach(onCreated);
        await maybeSplitWithFriends(
          values,
          expenses.reduce((sum, e) => sum + e.amount, 0),
        );
      } else {
        const expense = await createExpense(values);
        onCreated(expense);
        await maybeSplitWithFriends(values, expense.amount);
      }
      onClose();
    } catch (err) {
      if (err instanceof DuplicateExpenseError) {
        setPendingDuplicate({ values, duplicate: err.duplicate });
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDuplicate() {
    if (!pendingDuplicate) return;
    const { values } = pendingDuplicate;
    setPendingDuplicate(null);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const expense = await createExpense(values, true);
      onCreated(expense);
      await maybeSplitWithFriends(values, expense.amount);
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
          receiptData.append("image", await downscaleImage(file));
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
      await maybeSplitWithFriends(values, expense.amount);
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
      await maybeSplitWithFriends(values, expense.amount);
      advanceVoiceQueue();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={t("form.addTransaction")} wide={tab === "manual"}>
      {/* Three tappable method tiles instead of a thin pill row — each
          carries its own accent (matching the amber/violet used on the
          scan/voice review cards below) so which entry method you're on
          reads at a glance, not just from a text label. */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => setTab("manual")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition ${
            tab === "manual"
              ? "border-navy/30 bg-navy/10 text-navy dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
              : "border-surface-line text-surface-foreground-soft hover:border-navy/30 hover:text-surface-foreground"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              tab === "manual" ? "bg-navy text-white dark:bg-blue-500" : "bg-bg-soft"
            }`}
          >
            <PencilTabIcon />
          </span>
          {t("modal.manual")}
        </button>
        <button
          onClick={() => setTab("scan")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition ${
            tab === "scan"
              ? "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-surface-line text-surface-foreground-soft hover:border-amber-400/40 hover:text-surface-foreground"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              tab === "scan" ? "bg-amber-500 text-white" : "bg-bg-soft"
            }`}
          >
            <ScanTabIcon />
          </span>
          {t("modal.scan")}
        </button>
        <button
          onClick={() => setTab("voice")}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition ${
            tab === "voice"
              ? "border-violet-400/40 bg-violet-500/10 text-violet-700 dark:text-violet-400"
              : "border-surface-line text-surface-foreground-soft hover:border-violet-400/40 hover:text-surface-foreground"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              tab === "voice" ? "bg-violet-500 text-white" : "bg-bg-soft"
            }`}
          >
            <MicTabIcon />
          </span>
          {t("modal.speak")}
        </button>
      </div>

      {tab === "manual" && (
        <>
          {pendingDuplicate && (
            <div className="mb-4 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950/40">
              <p className="font-semibold text-amber-900 dark:text-amber-200">{t("form.duplicateWarningTitle")}</p>
              <p className="mt-1 text-amber-800 dark:text-amber-300">{t("form.duplicateWarningBody")}</p>
              <p className="mt-1 font-medium text-amber-900 dark:text-amber-200">
                {pendingDuplicate.duplicate.merchant} · {formatCurrency(Number(pendingDuplicate.duplicate.amount), currency)} ·{" "}
                {pendingDuplicate.duplicate.date}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDuplicate(null)}
                  disabled={submitting}
                  className="rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-transparent dark:text-amber-200"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDuplicate}
                  disabled={submitting}
                  className="rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  {t("form.saveDuplicateAnyway")}
                </button>
              </div>
            </div>
          )}
          <ExpenseForm
            initialValues={{ ...emptyExpenseFormValues, type: initialType }}
            submitLabel={t("form.addTransaction")}
            onSubmit={handleManualSubmit}
            submitting={submitting}
            error={submitError}
            allowSplit
            allowFriendSplit
          />
        </>
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
              <div className="mb-4 flex items-center gap-3 rounded-card border border-amber-200/70 bg-gradient-to-br from-amber-50 via-surface-soft to-surface-soft p-3 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-surface-soft dark:to-surface-soft">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Document preview" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ScanTabIcon />
                  </span>
                )}
                <div className="min-w-0">
                  {queue.length > 1 && (
                    <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
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
                <p className="mb-4 rounded-card bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-300">
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
                allowFriendSplit
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

          {voiceStatus === "review" && voiceQueue[voiceQueueIndex] && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-card border border-violet-200/70 bg-gradient-to-br from-violet-50 via-surface-soft to-surface-soft p-3 dark:border-violet-900/50 dark:from-violet-950/30 dark:via-surface-soft dark:to-surface-soft">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <MicTabIcon />
                </span>
                <div className="min-w-0">
                  {voiceQueue.length > 1 && (
                    <p className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-400">
                      Reviewing {voiceQueueIndex + 1} of {voiceQueue.length}
                    </p>
                  )}
                  <p className="text-xs text-surface-foreground-soft">
                    {voiceQueue.length > 1
                      ? "Heard multiple transactions — review each before saving. Double-check the amounts and expense/income toggles, since spoken numbers can occasionally be misheard."
                      : "Review the details below before saving — double-check the amount and expense/income toggle, since spoken numbers can occasionally be misheard."}
                  </p>
                </div>
              </div>
              {voiceQueue[voiceQueueIndex].conversion && (
                <p className="mb-4 rounded-card bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-300">
                  Converted from{" "}
                  {formatCurrency(
                    voiceQueue[voiceQueueIndex].conversion!.originalAmount,
                    voiceQueue[voiceQueueIndex].conversion!.originalCurrency,
                  )}{" "}
                  to {currency}.
                </p>
              )}
              <ExpenseForm
                key={voiceQueueIndex}
                initialValues={voiceQueue[voiceQueueIndex].values}
                submitLabel={voiceQueueIndex + 1 < voiceQueue.length ? "Save & next" : "Save transaction"}
                onSubmit={handleVoiceSubmit}
                onCancel={advanceVoiceQueue}
                submitting={submitting}
                error={submitError}
                allowFriendSplit
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// Creates the shared Split bills record for a "split this bill with
// friends" expense: the friends' amounts came straight from the form, but
// for a custom split the creator's own share is never asked for directly
// (it's just "whatever's left") -- so it's computed here as the remainder
// and the creator's own account id is fetched to attach it, since
// POST /api/splits requires every participant's share to be given
// explicitly and to sum to exactly the total.
async function createSplitFromExpense(
  totalAmount: number,
  title: string,
  date: string,
  splitWithFriends: NonNullable<ExpenseFormValues["splitWithFriends"]>,
): Promise<void> {
  let customOwed: { userId: number; amount: number }[] | undefined;
  if (splitWithFriends.splitMethod === "custom") {
    const accountRes = await fetch("/api/account");
    const account = await accountRes.json();
    const friendsOwed = splitWithFriends.participantIds.map((id) => ({
      userId: id,
      amount: splitWithFriends.customOwed?.find((e) => e.userId === id)?.amount ?? 0,
    }));
    const friendsTotal = friendsOwed.reduce((sum, e) => sum + e.amount, 0);
    const myShare = Math.round((totalAmount - friendsTotal) * 100) / 100;
    customOwed = [...friendsOwed, { userId: account.id, amount: myShare }];
  }
  const res = await fetch("/api/splits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title || "Split bill",
      totalAmount,
      splitMethod: splitWithFriends.splitMethod,
      paymentMethod: "single_payer",
      date,
      participantIds: splitWithFriends.participantIds,
      customOwed,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not create the split.");
  }
}

async function createSplitExpense(values: ExpenseFormValues): Promise<Expense[]> {
  const res = await fetch("/api/expenses/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: values.type,
      date: values.date,
      merchant: values.merchant,
      notes: values.notes || undefined,
      tags: values.tags,
      walletId: values.walletId,
      lines: (values.splitLines ?? []).map((l) => ({ category: l.category, amount: Number(l.amount) })),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that split transaction.");
  }
  return (data.expenses as Record<string, unknown>[]).map((e) => ({
    id: e.id as number,
    type: normalizeExpenseType(e.type as string),
    direction: normalizeDirection(e.direction as string | null),
    date: e.date as string,
    amount: Number(e.amount),
    merchant: e.merchant as string,
    category: e.category as string,
    notes: e.notes as string | null,
    tags: (e.tags as string[]) ?? [],
    hasReceipt: (e.has_receipt as boolean) ?? false,
    walletId: (e.wallet_id as number | null) ?? null,
    walletName: (e.wallet_name as string | null) ?? null,
    splitGroupId: (e.split_group_id as string | null) ?? null,
  }));
}

// Thrown by createExpense() when the server flags a likely duplicate
// (409, see api/expenses/route.ts) — carries the existing match so the
// caller can show what it collided with rather than a generic error.
export class DuplicateExpenseError extends Error {
  duplicate: { id: number; date: string; amount: string; merchant: string };
  constructor(duplicate: { id: number; date: string; amount: string; merchant: string }) {
    super("duplicate");
    this.duplicate = duplicate;
  }
}

async function createExpense(values: ExpenseFormValues, confirmDuplicate = false): Promise<Expense> {
  // Note: the server-side duplicate check (409) needs a live round trip, so
  // it's simply skipped while offline — mutateFetch queues the request
  // instead of reaching the server at all (see fetch-wrapper.ts).
  const res = await mutateFetch("/api/expenses", {
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
      confirmDuplicate,
    }),
  });
  const data = await res.json();
  if (res.status === 409 && data.duplicate) {
    throw new DuplicateExpenseError(data.duplicate);
  }
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not save that entry.");
  }
  // data.expense is absent when this was queued offline — return a
  // placeholder with a negative temp id so the UI can show it right away;
  // it's superseded by the real row (and its real id) the next time this
  // account's data is refreshed after the queue syncs.
  if (!data.expense) {
    return {
      id: -Date.now(),
      type: normalizeExpenseType(values.type),
      direction: normalizeDirection(values.type === "transfer" ? (values.direction ?? null) : null),
      date: values.date,
      amount: Number(values.amount),
      merchant: values.merchant,
      category: values.category,
      notes: values.notes || null,
      tags: values.tags,
      hasReceipt: false,
      walletId: values.walletId ?? null,
      walletName: null,
      splitGroupId: null,
    };
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
    splitGroupId: data.expense.split_group_id ?? null,
  };
}
