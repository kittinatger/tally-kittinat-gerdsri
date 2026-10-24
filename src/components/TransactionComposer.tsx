"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  CopyIcon,
  MicrophoneIcon,
  PlusIcon,
  ScanIcon,
  SparkleIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { TransactionType } from "@/lib/categories";
import { isTransactionType, isTransferDirection } from "@/lib/categories";
import { useAllCategories } from "@/lib/categories-context";
import { useWallets } from "@/lib/wallets-context";
import { useCurrency } from "@/lib/currency-context";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon } from "@/lib/icons";
import { formatCurrency, formatDateLong, todayInputValue } from "@/lib/format";
import { downscaleImage } from "@/lib/image-downscale";
import { describeFetchError } from "@/lib/fetch-error";
import { logAppError } from "@/lib/error-log";
import { useT } from "@/lib/language-context";
import {
  attachReceipt,
  createExpense,
  createSplitExpense,
  createSplitWithFriends,
  DuplicateExpenseError,
  type DuplicateMatch,
} from "@/lib/transaction-api";
import type { ExpenseFormValues } from "./ExpenseForm";
import DatePicker from "./DatePicker";
import LocationField from "./LocationField";
import ReceiptDropzone from "./ReceiptDropzone";
import SelectDropdown from "./SelectDropdown";
import TagInput from "./TagInput";
import VoiceRecorder from "./VoiceRecorder";

// Above the server's own worst case (one 45s model attempt plus one 30s
// lite fallback, under the route's 120s maxDuration) — a backstop so a stuck
// request always resolves to a clear error.
const AI_FETCH_TIMEOUT_MS = 125_000;
// Categories shown before "More" — enough for two rows on a phone.
const CATEGORY_PREVIEW = 11;

type Conversion = { originalAmount: number; originalCurrency: string };
type Prefill = { values: ExpenseFormValues; conversion: Conversion | null };
type Friend = { id: number; username: string };
type Line = { category: string; amount: string };

// Where the current form contents came from. Scans and voice can produce
// several entries; each is reviewed in this same form, one at a time.
type Source =
  | { kind: "manual" }
  | { kind: "scan"; files: File[]; index: number; previewUrl: string | null; model: string | null }
  | { kind: "voice"; items: Prefill[]; index: number; model: string | null };

type Capture =
  | { kind: "none" }
  | { kind: "scan"; status: "pick" | "reading" | "error"; error?: string; files?: File[]; index?: number; previewUrl?: string }
  | { kind: "voice"; status: "record" | "listening" | "error"; error?: string; recording?: { blob: Blob; mimeType: string } };

const inputClass =
  "w-full rounded-xl border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition placeholder:text-surface-foreground-soft/60 focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft";

const TYPE_ACCENT: Record<TransactionType, { text: string; solid: string; soft: string }> = {
  expense: { text: "text-rose-600 dark:text-rose-400", solid: "bg-rose-500 hover:bg-rose-600", soft: "bg-rose-500/10" },
  income: { text: "text-emerald-600 dark:text-emerald-400", solid: "bg-emerald-500 hover:bg-emerald-600", soft: "bg-emerald-500/10" },
  transfer: { text: "text-sky-600 dark:text-sky-400", solid: "bg-sky-500 hover:bg-sky-600", soft: "bg-sky-500/10" },
};

function currencySymbol(currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

function blankValues(type: TransactionType, walletId: number | null, date = todayInputValue()): ExpenseFormValues {
  return { type, direction: "out", date, amount: "", merchant: "", category: "Other", notes: "", tags: [], walletId, locationName: "", latitude: null, longitude: null };
}

/**
 * The Add transaction page's form, built for a full page rather than a
 * popup: type and a large amount up top, "fill it for me" shortcuts (scan a
 * receipt, or say it), the essentials in one card, optional extras behind
 * "More details", and a save bar that stays in reach. A likely duplicate
 * asks once, with "Add anyway", for every way of entering.
 */
export default function TransactionComposer({
  initialType,
  initialWalletId,
  onSaved,
  onDone,
}: {
  initialType: TransactionType;
  initialWalletId: number | null;
  /** Called after each successful save (a scan batch can save several). */
  onSaved: () => void;
  /** Leave the page — after the last save, or on Cancel. */
  onDone: () => void;
}) {
  const t = useT();
  const allCategories = useAllCategories();
  const wallets = useWallets();
  const currency = useCurrency();

  const [values, setValues] = useState<ExpenseFormValues>(() => blankValues(initialType, initialWalletId));
  const [source, setSource] = useState<Source>({ kind: "manual" });
  const [capture, setCapture] = useState<Capture>({ kind: "none" });
  const [moreOpen, setMoreOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState<Line[]>([
    { category: "Other", amount: "" },
    { category: "Other", amount: "" },
  ]);
  const [friendSplit, setFriendSplit] = useState(false);
  const [friendIds, setFriendIds] = useState<number[]>([]);
  const [friendMethod, setFriendMethod] = useState<"equal" | "custom">("equal");
  const [friendOwed, setFriendOwed] = useState<Record<number, string>>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ match: DuplicateMatch; addAnother: boolean } | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [conversion, setConversion] = useState<Conversion | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/merchants")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.merchants)) setMerchants(data.merchants);
      })
      .catch(() => {});
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.friends)) setFriends(data.friends);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const accent = TYPE_ACCENT[values.type];
  const categories = useMemo(() => allCategories.filter((c) => c.type === values.type), [allCategories, values.type]);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORY_PREVIEW);
  const hiddenSelected = !showAllCategories && !visibleCategories.some((c) => c.name === values.category);
  const defaultWallet = wallets.find((w) => w.isDefault) ?? wallets[0];
  const walletId = values.walletId ?? defaultWallet?.id ?? null;
  const splitTotal = splitLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const queueLabel =
    source.kind === "scan" && source.files.length > 1
      ? `${source.index + 1} / ${source.files.length}`
      : source.kind === "voice" && source.items.length > 1
        ? `${source.index + 1} / ${source.items.length}`
        : null;
  const hasMoreInQueue =
    (source.kind === "scan" && source.index + 1 < source.files.length) || (source.kind === "voice" && source.index + 1 < source.items.length);

  function update<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDuplicate(null);
  }

  function setType(type: TransactionType) {
    setValues((prev) => {
      const stillValid = allCategories.some((c) => c.type === type && c.name === prev.category);
      return { ...prev, type, category: stillValid ? prev.category : "Other" };
    });
    if (type === "transfer") setSplitMode(false);
    if (type !== "expense") setFriendSplit(false);
    setDuplicate(null);
  }

  // Fills the form from a scanned or spoken entry — everything stays
  // editable before saving.
  function applyPrefill(prefill: Prefill) {
    setValues(prefill.values);
    setConversion(prefill.conversion);
    setSplitMode(false);
    setFriendSplit(false);
    setDuplicate(null);
    setError(null);
    setMoreOpen(Boolean(prefill.values.notes || prefill.values.locationName));
  }

  function resetToManual(keep?: ExpenseFormValues) {
    setValues(blankValues(keep?.type ?? values.type, keep?.walletId ?? values.walletId, keep?.date));
    setSource({ kind: "manual" });
    setConversion(null);
    setSplitMode(false);
    setSplitLines([
      { category: "Other", amount: "" },
      { category: "Other", amount: "" },
    ]);
    setFriendSplit(false);
    setFriendIds([]);
    setFriendOwed({});
    setDuplicate(null);
    setError(null);
  }

  // ── Scan ────────────────────────────────────────────────────────────
  function categoryOrOther(type: TransactionType, name: string) {
    return allCategories.some((c) => c.type === type && c.name === name) ? name : "Other";
  }

  async function readFile(files: File[], index: number) {
    const file = files[index];
    const previewUrl = URL.createObjectURL(file);
    setCapture({ kind: "scan", status: "reading", files, index, previewUrl });
    const formData = new FormData();
    formData.append("image", await downscaleImage(file));
    formData.append("fallbackDate", todayInputValue());
    try {
      const res = await fetch("/api/extract-receipt", { method: "POST", body: formData, signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS) });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Could not read that document.";
        setCapture({ kind: "scan", status: "error", error: message, files, index, previewUrl });
        logAppError("Scan document", message);
        return;
      }
      const x = data.extraction as {
        type: string;
        direction?: string;
        merchant: string;
        amount: number;
        date: string;
        category: string;
        wallet?: string;
        location?: string;
        originalAmount?: number;
        originalCurrency?: string;
      };
      const type = isTransactionType(x.type) ? x.type : "expense";
      applyPrefill({
        values: {
          type,
          direction: x.direction && isTransferDirection(x.direction) ? x.direction : "out",
          date: x.date,
          amount: String(x.amount),
          merchant: x.merchant,
          category: categoryOrOther(type, x.category),
          notes: "",
          tags: [],
          walletId: wallets.find((w) => w.name === x.wallet)?.id ?? values.walletId,
          locationName: x.location ?? "",
          latitude: null,
          longitude: null,
        },
        conversion: x.originalAmount !== undefined && x.originalCurrency ? { originalAmount: x.originalAmount, originalCurrency: x.originalCurrency } : null,
      });
      setSource({ kind: "scan", files, index, previewUrl, model: typeof data.model === "string" ? data.model : null });
      setCapture({ kind: "none" });
    } catch (err) {
      setCapture({ kind: "scan", status: "error", error: describeFetchError(err, "Scan document"), files, index, previewUrl });
    }
  }

  // ── Voice ───────────────────────────────────────────────────────────
  async function listen(blob: Blob, mimeType: string) {
    setCapture({ kind: "voice", status: "listening", recording: { blob, mimeType } });
    const formData = new FormData();
    formData.append("audio", blob, `recording.${mimeType.split("/")[1]?.split(";")[0] ?? "webm"}`);
    formData.append("fallbackDate", todayInputValue());
    try {
      const res = await fetch("/api/extract-voice", { method: "POST", body: formData, signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS) });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Could not understand that recording.";
        setCapture({ kind: "voice", status: "error", error: message, recording: { blob, mimeType } });
        logAppError("Voice entry", message);
        return;
      }
      const items: Prefill[] = (
        data.extractions as {
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
        }[]
      ).map((x) => {
        const type = isTransactionType(x.type) ? x.type : "expense";
        return {
          values: {
            type,
            direction: x.direction && isTransferDirection(x.direction) ? x.direction : "out",
            date: x.date,
            amount: String(x.amount),
            merchant: x.merchant,
            category: categoryOrOther(type, x.category),
            notes: x.notes ?? "",
            tags: [],
            walletId: wallets.find((w) => w.name === x.wallet)?.id ?? values.walletId,
            locationName: "",
            latitude: null,
            longitude: null,
          },
          conversion: x.originalAmount !== undefined && x.originalCurrency ? { originalAmount: x.originalAmount, originalCurrency: x.originalCurrency } : null,
        };
      });
      if (items.length === 0) {
        setCapture({ kind: "voice", status: "error", error: "Didn't catch a transaction in that — try again.", recording: { blob, mimeType } });
        return;
      }
      applyPrefill(items[0]);
      setSource({ kind: "voice", items, index: 0, model: typeof data.model === "string" ? data.model : null });
      setCapture({ kind: "none" });
    } catch (err) {
      setCapture({ kind: "voice", status: "error", error: describeFetchError(err, "Voice entry"), recording: { blob, mimeType } });
    }
  }

  // Moves to the next scanned/spoken entry, or finishes the batch.
  function advance() {
    if (source.kind === "scan" && source.index + 1 < source.files.length) {
      if (source.previewUrl) URL.revokeObjectURL(source.previewUrl);
      readFile(source.files, source.index + 1);
      return;
    }
    if (source.kind === "voice" && source.index + 1 < source.items.length) {
      const index = source.index + 1;
      applyPrefill(source.items[index]);
      setSource({ ...source, index });
      return;
    }
    onDone();
  }

  // ── Save ────────────────────────────────────────────────────────────
  async function save(addAnother: boolean, confirmDuplicate = false) {
    setSubmitting(true);
    setError(null);
    const withFriends: ExpenseFormValues =
      values.type === "expense" && friendSplit && friendIds.length > 0
        ? {
            ...values,
            splitWithFriends: {
              participantIds: friendIds,
              splitMethod: friendMethod,
              customOwed: friendMethod === "custom" ? friendIds.map((id) => ({ userId: id, amount: Number(friendOwed[id]) || 0 })) : undefined,
            },
          }
        : values;
    try {
      let total: number;
      if (splitMode) {
        const saved = await createSplitExpense({ ...withFriends, splitLines });
        total = saved.reduce((sum, e) => sum + e.amount, 0);
      } else {
        const saved = await createExpense(withFriends, confirmDuplicate);
        total = saved.amount;
        if (source.kind === "scan" && saved.id > 0) await attachReceipt(saved.id, source.files[source.index]);
      }
      if (withFriends.splitWithFriends) {
        try {
          await createSplitWithFriends(total, values.merchant, values.date, withFriends.splitWithFriends);
        } catch (err) {
          // Best-effort: the transaction itself is already saved.
          logAppError("Split with friends", err instanceof Error ? err.message : "Could not create the split with friends.");
        }
      }
      onSaved();
      setSavedCount((n) => n + 1);
      setDuplicate(null);
      if (source.kind !== "manual") advance();
      else if (addAnother) resetToManual(values);
      else onDone();
    } catch (err) {
      if (err instanceof DuplicateExpenseError) setDuplicate({ match: err.duplicate, addAnother });
      else setError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(false);
  }

  const busy = capture.kind !== "none" && (capture.status === "reading" || capture.status === "listening");
  const sourceLabel = values.type === "income" ? t("form.source") : values.type === "transfer" ? t("form.description") : t("form.merchant");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ── Type + amount ─────────────────────────────────────────── */}
      <section className="rounded-card border border-surface-line bg-surface px-4 pb-5 pt-4 sm:px-6">
        <div role="group" className="flex rounded-full bg-surface-soft p-1">
          {(["expense", "income", "transfer"] as TransactionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setType(type)}
              aria-pressed={values.type === type}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                values.type === type ? `bg-surface shadow-sm ${TYPE_ACCENT[type].text}` : "text-surface-foreground-soft hover:text-surface-foreground"
              }`}
            >
              {type === "expense" ? t("common.expense") : type === "income" ? t("common.income") : t("common.transfer")}
            </button>
          ))}
        </div>

        <label htmlFor="composer-amount" className="sr-only">
          {t("form.amount")}
        </label>
        <div className={`mt-6 flex items-baseline justify-center gap-1.5 ${accent.text}`}>
          <span className="text-2xl font-semibold opacity-70">{currencySymbol(currency)}</span>
          {splitMode ? (
            <span className="text-5xl font-semibold tabular-nums tracking-tight">{splitTotal.toFixed(2)}</span>
          ) : (
            <input
              id="composer-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              autoFocus={source.kind === "manual"}
              value={values.amount}
              onChange={(e) => update("amount", e.target.value)}
              placeholder="0.00"
              style={{ width: `${Math.max(4, values.amount.length + 1)}ch` }}
              className="max-w-full bg-transparent text-center text-5xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-current placeholder:opacity-25 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          )}
        </div>
        {splitMode && <p className="mt-1 text-center text-xs text-surface-foreground-soft">{t("form.categoriesAndAmounts")}</p>}

        {values.type === "transfer" && (
          <div className="mx-auto mt-4 max-w-xs">
            <div className="flex rounded-full bg-surface-soft p-1">
              {(["out", "in"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => update("direction", dir)}
                  aria-pressed={values.direction === dir}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                    values.direction === dir ? "bg-surface text-surface-foreground shadow-sm" : "text-surface-foreground-soft"
                  }`}
                >
                  {dir === "out" ? t("form.moneyOut") : t("form.moneyIn")}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-center text-xs text-surface-foreground-soft">{t("form.transferNote")}</p>
          </div>
        )}
      </section>

      {/* ── Fill it for me ────────────────────────────────────────── */}
      {source.kind === "manual" && capture.kind === "none" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCapture({ kind: "scan", status: "pick" })}
            className="flex items-center gap-3 rounded-card border border-surface-line bg-surface p-3.5 text-left transition hover:border-amber-400/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ScanIcon weight="bold" aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-surface-foreground">{t("modal.scan")}</span>
              <span className="block truncate text-xs text-surface-foreground-soft">Receipt or bill</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCapture({ kind: "voice", status: "record" })}
            className="flex items-center gap-3 rounded-card border border-surface-line bg-surface p-3.5 text-left transition hover:border-violet-400/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <MicrophoneIcon weight="bold" aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-surface-foreground">{t("modal.speak")}</span>
              <span className="block truncate text-xs text-surface-foreground-soft">Say what you spent</span>
            </span>
          </button>
        </div>
      )}

      {capture.kind !== "none" && (
        <section className="rounded-card border border-surface-line bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-surface-foreground">
              {capture.kind === "scan" ? (
                <ScanIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-amber-500" />
              ) : (
                <MicrophoneIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-violet-500" />
              )}
              {capture.kind === "scan" ? t("modal.scan") : t("modal.speak")}
            </p>
            {!busy && (
              <button
                type="button"
                onClick={() => setCapture({ kind: "none" })}
                aria-label={t("common.cancel")}
                className="flex h-7 w-7 items-center justify-center rounded-full text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
              >
                <XIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {capture.kind === "scan" && capture.status === "pick" && <ReceiptDropzone onFilesSelected={(files) => files.length > 0 && readFile(files, 0)} />}
          {capture.kind === "voice" && capture.status === "record" && <VoiceRecorder onRecorded={listen} />}

          {busy && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              {capture.kind === "scan" && capture.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={capture.previewUrl} alt="" className="h-28 w-28 rounded-xl object-cover" />
              )}
              <p className="flex items-center gap-2 text-sm font-semibold text-surface-foreground-soft">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface-accent border-t-transparent" />
                {capture.kind === "scan"
                  ? capture.files && capture.files.length > 1
                    ? `Reading ${(capture.index ?? 0) + 1} of ${capture.files.length}…`
                    : "Reading…"
                  : "Listening…"}
              </p>
            </div>
          )}

          {capture.status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{capture.error}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    capture.kind === "scan"
                      ? capture.files && readFile(capture.files, capture.index ?? 0)
                      : capture.recording && listen(capture.recording.blob, capture.recording.mimeType)
                  }
                  className="flex items-center gap-1.5 rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
                >
                  <ArrowCounterClockwiseIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => setCapture(capture.kind === "scan" ? { kind: "scan", status: "pick" } : { kind: "voice", status: "record" })}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                >
                  {capture.kind === "scan" ? "Choose another" : "Record again"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {source.kind !== "manual" && (
        <div
          className={`flex items-center gap-3 rounded-card border p-3 ${
            source.kind === "scan" ? "border-amber-300/60 bg-amber-500/5 dark:border-amber-800/60" : "border-violet-300/60 bg-violet-500/5 dark:border-violet-800/60"
          }`}
        >
          {source.kind === "scan" && source.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={source.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <SparkleIcon weight="fill" aria-hidden="true" className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-foreground">
              {source.kind === "scan" ? "Filled from your receipt" : "Filled from what you said"}
              {queueLabel && <span className="ml-1.5 text-xs font-medium text-surface-foreground-soft">{queueLabel}</span>}
            </p>
            <p className="text-xs text-surface-foreground-soft">
              Check the amount and type before saving.
              {source.model && <> · {t("ai.modelUsed").replace("{model}", source.model)}</>}
            </p>
            {conversion && (
              <p className="mt-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                Converted from {formatCurrency(conversion.originalAmount, conversion.originalCurrency)} to {currency}.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => resetToManual()}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            {t("common.clear")}
          </button>
        </div>
      )}

      {/* ── Essentials ────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-card border border-surface-line bg-surface p-4 sm:p-6">
        <div>
          <label htmlFor="composer-merchant" className={labelClass}>
            {sourceLabel}
          </label>
          <input
            id="composer-merchant"
            type="text"
            required
            list="composer-merchants"
            value={values.merchant}
            onChange={(e) => update("merchant", e.target.value)}
            placeholder={
              values.type === "income"
                ? t("form.merchantPlaceholderIncome")
                : values.type === "transfer"
                  ? t("form.merchantPlaceholderTransfer")
                  : t("form.merchantPlaceholderExpense")
            }
            className={inputClass}
          />
          <datalist id="composer-merchants">
            {merchants.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        {splitMode ? (
          <div>
            <p className={labelClass}>{t("form.categoriesAndAmounts")}</p>
            <div className="space-y-2">
              {splitLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <SelectDropdown
                      value={line.category}
                      options={categories.map((c) => c.name)}
                      onChange={(name) => setSplitLines((prev) => prev.map((l, j) => (j === i ? { ...l, category: name } : l)))}
                      renderIndicator={(name) => (
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses(categories.find((c) => c.name === name)?.color)}`} />
                      )}
                    />
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={line.amount}
                    onChange={(e) => setSplitLines((prev) => prev.map((l, j) => (j === i ? { ...l, amount: e.target.value } : l)))}
                    placeholder="0.00"
                    className={`${inputClass} w-28`}
                  />
                  {splitLines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setSplitLines((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove line"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-red-600"
                    >
                      <XIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSplitLines((prev) => [...prev, { category: "Other", amount: "" }])}
                className="flex items-center gap-1 text-sm font-semibold text-surface-accent hover:underline"
              >
                <PlusIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
                {t("form.addAnotherCategory")}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className={labelClass}>{t("common.category")}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {visibleCategories.map((c) => {
                const selected = values.category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => update("category", c.name)}
                    aria-pressed={selected}
                    className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition ${
                      selected ? "border-surface-accent bg-surface-accent/5" : "border-transparent hover:bg-[var(--surface-nav-hover)]"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${badgeClasses(c.color)}`}>
                      {c.icon && isCategoryIconKey(c.icon) ? (
                        <CategoryIcon iconKey={c.icon} className="h-5 w-5" />
                      ) : (
                        <span className="text-base font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className={`w-full truncate text-center text-[11px] font-medium ${selected ? "text-surface-foreground" : "text-surface-foreground-soft"}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
              {categories.length > CATEGORY_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((v) => !v)}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition hover:bg-[var(--surface-nav-hover)] ${
                    hiddenSelected ? "border-surface-accent bg-surface-accent/5" : "border-transparent"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft text-surface-foreground-soft">
                    <CaretDownIcon weight="bold" aria-hidden="true" className={`h-4 w-4 transition-transform ${showAllCategories ? "rotate-180" : ""}`} />
                  </span>
                  <span className="w-full truncate text-center text-[11px] font-medium text-surface-foreground-soft">
                    {showAllCategories ? "Less" : hiddenSelected ? values.category : `+${categories.length - CATEGORY_PREVIEW}`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="composer-date" className={labelClass}>
              {t("common.date")}
            </label>
            <DatePicker id="composer-date" value={values.date} onChange={(date) => update("date", date)} required />
          </div>
          {wallets.length > 0 && (
            <div>
              <label htmlFor="composer-wallet" className={labelClass}>
                {t("common.wallet")}
              </label>
              <SelectDropdown
                id="composer-wallet"
                value={wallets.find((w) => w.id === walletId)?.name ?? ""}
                options={wallets.map((w) => w.name)}
                onChange={(name) => {
                  const w = wallets.find((x) => x.name === name);
                  if (w) update("walletId", w.id);
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── More details ──────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-card border border-surface-line bg-surface">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left sm:px-6"
        >
          <span>
            <span className="block text-sm font-semibold text-surface-foreground">More details</span>
            <span className="block text-xs text-surface-foreground-soft">Location, tags, notes, splits</span>
          </span>
          <CaretDownIcon weight="bold" aria-hidden="true" className={`h-4 w-4 shrink-0 text-surface-foreground-soft transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </button>
        {moreOpen && (
          <div className="space-y-5 border-t border-surface-line p-4 sm:p-6">
            <LocationField
              labelClass={labelClass}
              value={{ locationName: values.locationName ?? "", latitude: values.latitude ?? null, longitude: values.longitude ?? null }}
              onChange={(loc) => setValues((prev) => ({ ...prev, ...loc }))}
            />
            <div>
              <p className={labelClass}>{t("common.tags")}</p>
              <TagInput tags={values.tags} onChange={(tags) => update("tags", tags)} />
            </div>
            <div>
              <label htmlFor="composer-notes" className={labelClass}>
                {t("common.notes")}
              </label>
              <textarea
                id="composer-notes"
                rows={2}
                value={values.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder={t("form.notesPlaceholder")}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="space-y-3">
              {values.type !== "transfer" && source.kind === "manual" && (
                <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-soft px-3.5 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-surface-foreground">
                    <CopyIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
                    {t("form.splitIntoCategories")}
                  </span>
                  <input type="checkbox" checked={splitMode} onChange={(e) => setSplitMode(e.target.checked)} className="h-4 w-4 accent-surface-accent" />
                </label>
              )}
              {values.type === "expense" && friends.length > 0 && (
                <div className="rounded-xl bg-surface-soft px-3.5 py-3">
                  <label className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-sm font-medium text-surface-foreground">
                      <UsersThreeIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
                      Split this bill with friends
                    </span>
                    <input type="checkbox" checked={friendSplit} onChange={(e) => setFriendSplit(e.target.checked)} className="h-4 w-4 accent-surface-accent" />
                  </label>
                  {friendSplit && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {friends.map((f) => {
                          const on = friendIds.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setFriendIds((prev) => (on ? prev.filter((id) => id !== f.id) : [...prev, f.id]))}
                              aria-pressed={on}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                on ? "bg-surface-accent text-white" : "bg-surface text-surface-foreground-soft hover:text-surface-foreground"
                              }`}
                            >
                              {f.username}
                            </button>
                          );
                        })}
                      </div>
                      {friendIds.length > 0 && (
                        <>
                          <div className="flex rounded-full bg-surface p-1">
                            {(["equal", "custom"] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setFriendMethod(m)}
                                className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                                  friendMethod === m ? "bg-surface-soft text-surface-foreground" : "text-surface-foreground-soft"
                                }`}
                              >
                                {m === "equal" ? "Equal split" : "Custom amounts"}
                              </button>
                            ))}
                          </div>
                          {friendMethod === "custom" ? (
                            <div className="space-y-1.5">
                              {friendIds.map((id) => (
                                <div key={id} className="flex items-center gap-2">
                                  <span className="w-28 shrink-0 truncate text-sm text-surface-foreground">{friends.find((f) => f.id === id)?.username}</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={friendOwed[id] ?? ""}
                                    onChange={(e) => setFriendOwed((prev) => ({ ...prev, [id]: e.target.value }))}
                                    placeholder="0.00"
                                    className={`${inputClass} flex-1 bg-surface`}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-surface-foreground-soft">
                              Split evenly between you and {friendIds.length} friend{friendIds.length === 1 ? "" : "s"}, tracked in Split bills.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Save bar ──────────────────────────────────────────────── */}
      <div className="sticky bottom-[88px] z-10 -mx-1 sm:bottom-4">
        {duplicate && (
          <div className="mb-2 rounded-card border border-amber-300 bg-amber-50 p-3.5 shadow-soft animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none dark:border-amber-700 dark:bg-amber-950">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t("form.duplicateWarningTitle")}</p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              {t("form.duplicateWarningBody")} {duplicate.match.merchant} · {formatCurrency(Number(duplicate.match.amount), currency)} ·{" "}
              {formatDateLong(duplicate.match.date)}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => (source.kind === "manual" ? setDuplicate(null) : advance())}
                disabled={submitting}
                className="flex-1 rounded-full border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-transparent dark:text-amber-200"
              >
                {source.kind === "manual" ? t("common.cancel") : hasMoreInQueue ? "Skip this one" : "Don't add"}
              </button>
              <button
                type="button"
                onClick={() => save(duplicate.addAnother, true)}
                disabled={submitting}
                className="flex-1 rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {t("form.saveDuplicateAnyway")}
              </button>
            </div>
          </div>
        )}
        {error && <p className="mb-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-soft backdrop-blur-xl">
          {source.kind === "manual" ? (
            <button
              type="button"
              onClick={(e) => {
                const form = e.currentTarget.form;
                if (form && !form.reportValidity()) return;
                save(true);
              }}
              disabled={submitting || busy}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-50"
            >
              Save &amp; add another
            </button>
          ) : (
            <button
              type="button"
              onClick={advance}
              disabled={submitting}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-50"
            >
              {hasMoreInQueue ? "Skip" : t("common.cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || busy}
            className={`flex-1 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${accent.solid}`}
          >
            {submitting ? t("common.saving") : hasMoreInQueue ? "Save & next" : t("form.addTransaction")}
          </button>
        </div>
        {savedCount > 0 && source.kind === "manual" && (
          <p className="mt-1.5 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400" aria-live="polite">
            {savedCount === 1 ? "Saved. Add the next one." : `${savedCount} saved. Add the next one.`}
          </p>
        )}
      </div>
    </form>
  );
}
