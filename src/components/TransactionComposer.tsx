"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  BackspaceIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CheckIcon,
  CopyIcon,
  MicrophoneIcon,
  PlusIcon,
  ScanIcon,
  SparkleIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { TransactionType, TransferDirection } from "@/lib/categories";
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

/** The latest entry for one merchant — see listRecentEntryTemplates. */
export type RecentEntry = {
  merchant: string;
  type: TransactionType;
  direction: TransferDirection;
  category: string;
  amount: number;
  walletId: number | null;
};

// Above the server's own worst case (one 45s model attempt plus one 30s
// lite fallback, under the route's 120s maxDuration).
const AI_FETCH_TIMEOUT_MS = 125_000;
const CATEGORY_PREVIEW = 7;
const REPEAT_CHIPS = 8;
const KEYS = ["1", "2", "3", "back", "4", "5", "6", "+", "7", "8", "9", "−", ".", "0", "00", "done"];

type Conversion = { originalAmount: number; originalCurrency: string };
type Prefill = { values: ExpenseFormValues; conversion: Conversion | null };
type Friend = { id: number; username: string };
type Line = { category: string; amount: string };

// Where the form's contents came from. Scans and voice can produce several
// entries; each one is reviewed in this same form, in turn.
type Source =
  | { kind: "manual" }
  | { kind: "scan"; files: File[]; index: number; previewUrl: string | null; model: string | null }
  | { kind: "voice"; items: Prefill[]; index: number; model: string | null };

type Capture =
  | { kind: "none" }
  | { kind: "scan"; status: "pick" | "busy" | "error"; error?: string; files?: File[]; index?: number; previewUrl?: string }
  | { kind: "voice"; status: "pick" | "busy" | "error"; error?: string; recording?: { blob: Blob; mimeType: string } };

const HERO: Record<TransactionType, { bg: string; button: string; text: string }> = {
  expense: {
    bg: "from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-800",
    button: "bg-rose-500 hover:bg-rose-600",
    text: "text-rose-600 dark:text-rose-400",
  },
  income: {
    bg: "from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800",
    button: "bg-emerald-500 hover:bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  transfer: {
    bg: "from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-800",
    button: "bg-sky-500 hover:bg-sky-600",
    text: "text-sky-600 dark:text-sky-400",
  },
};

const inputClass =
  "w-full rounded-xl border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition placeholder:text-surface-foreground-soft/60 focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft";
const chipClass = (on: boolean) =>
  `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    on ? "border-surface-accent bg-surface-accent/10 text-surface-foreground" : "border-surface-line text-surface-foreground-soft hover:text-surface-foreground"
  }`;

function currencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "narrowSymbol" })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

function shiftDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

// The keypad's running sum: numbers joined by + and −, e.g. "120+45.5−10".
// Returns null while it isn't a finished, positive amount.
function evaluate(expr: string): number | null {
  if (!expr) return null;
  const parts = expr.match(/[+−]?[^+−]+/g);
  if (!parts) return null;
  let total = 0;
  for (const part of parts) {
    const sign = part.startsWith("−") ? -1 : 1;
    const n = Number(part.replace(/^[+−]/, ""));
    if (!Number.isFinite(n)) return null;
    total += sign * n;
  }
  const rounded = Math.round(total * 100) / 100;
  return rounded > 0 ? rounded : null;
}

// One keypad press applied to the expression: at most two decimals per
// number, no leading zeros, and an operator replaces a trailing one.
function applyKey(expr: string, key: string): string {
  if (key === "back") return expr.slice(0, -1);
  if (key === "+" || key === "−") {
    if (!expr) return expr;
    return (/[+−.]$/.test(expr) ? expr.slice(0, -1) : expr) + key;
  }
  const current = expr.split(/[+−]/).pop() ?? "";
  if (key === ".") return current.includes(".") ? expr : expr + (current === "" ? "0." : ".");
  const decimals = current.includes(".") ? current.split(".")[1].length : -1;
  if (decimals >= 2) return expr;
  let digits = key === "00" && decimals === 1 ? "0" : key;
  if (current === "" && digits === "00") digits = "0";
  if (current === "0") return expr.slice(0, -1) + (digits === "00" ? "0" : digits);
  if (expr.replace(/[+−.]/g, "").length >= 14) return expr;
  return expr + digits;
}

function blankValues(type: TransactionType, walletId: number | null, date = todayInputValue()): ExpenseFormValues {
  return { type, direction: "out", date, amount: "", merchant: "", category: "Other", notes: "", tags: [], walletId, locationName: "", latitude: null, longitude: null };
}

/**
 * The Add transaction page. The amount is entered on a built-in calculator
 * keypad (sums like 120+45.5 work, and so does a physical keyboard), recent
 * merchants can be repeated in one tap, and picking a merchant you've used
 * before fills in the category and wallet it had last time. Scan and Speak
 * fill the same form; splits and the rest live under "More". A likely
 * duplicate asks once, with "Add anyway", however the entry was made.
 */
export default function TransactionComposer({
  initialType,
  initialWalletId,
  recent,
  onSaved,
  onDone,
}: {
  initialType: TransactionType;
  initialWalletId: number | null;
  recent: RecentEntry[];
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
  const [expr, setExpr] = useState("");
  const [keypadOpen, setKeypadOpen] = useState(true);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [walletTouched, setWalletTouched] = useState(initialWalletId !== null);
  const [source, setSource] = useState<Source>({ kind: "manual" });
  const [capture, setCapture] = useState<Capture>({ kind: "none" });
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [allCats, setAllCats] = useState(false);
  const [pickDate, setPickDate] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ match: DuplicateMatch; addAnother: boolean } | null>(null);
  const [lastSaved, setLastSaved] = useState<{ merchant: string; amount: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
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

  const hero = HERO[values.type];
  const symbol = currencySymbol(currency);
  const categories = useMemo(() => allCategories.filter((c) => c.type === values.type), [allCategories, values.type]);
  // The selected category always stays visible, even past the preview.
  const shownCategories = useMemo(() => {
    if (allCats) return categories;
    const first = categories.slice(0, CATEGORY_PREVIEW);
    const selected = categories.find((c) => c.name === values.category);
    return selected && !first.includes(selected) ? [...first.slice(0, -1), selected] : first;
  }, [allCats, categories, values.category]);
  const defaultWallet = wallets.find((w) => w.isDefault) ?? wallets[0];
  const walletId = values.walletId ?? defaultWallet?.id ?? null;
  const splitTotal = splitLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const exprTotal = evaluate(expr);
  const amountNumber = splitMode ? splitTotal : (exprTotal ?? 0);
  const hasOperator = /[+−]/.test(expr.slice(1));
  const repeatChips = recent.filter((r) => r.type === values.type).slice(0, REPEAT_CHIPS);
  const merchantMatches = useMemo(() => {
    const q = values.merchant.trim().toLowerCase();
    if (!q) return [];
    return recent.filter((r) => r.merchant.toLowerCase().includes(q) && r.merchant.toLowerCase() !== q).slice(0, 5);
  }, [recent, values.merchant]);
  const busy = capture.kind !== "none" && capture.status === "busy";
  const queue =
    source.kind === "scan" ? { at: source.index, of: source.files.length } : source.kind === "voice" ? { at: source.index, of: source.items.length } : null;
  const moreInQueue = queue !== null && queue.at + 1 < queue.of;
  const today = todayInputValue();
  const yesterday = shiftDate(-1);

  function patch(next: Partial<ExpenseFormValues>) {
    setValues((prev) => ({ ...prev, ...next }));
    setDuplicate(null);
    setError(null);
  }

  // ── Amount keypad ───────────────────────────────────────────────────
  // The keypad expression is the amount's source of truth (values.amount
  // is filled from it on save) — updated functionally so quick successive
  // presses never read a stale expression.
  function press(key: string) {
    setExpr((prev) => applyKey(prev, key));
    setDuplicate(null);
    setError(null);
  }

  function finishAmount() {
    // Collapse a sum to its result so what's shown is what's saved.
    const total = evaluate(expr);
    if (total !== null) setExpr(String(total));
    if (total !== null) setKeypadOpen(false);
  }

  // A physical keyboard drives the keypad too, while it's open and focus
  // isn't in another field.
  useEffect(() => {
    if (!keypadOpen || splitMode) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, string> = { Backspace: "back", "+": "+", "-": "−", ".": ".", ",": "." };
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (map[e.key]) press(map[e.key]);
      else if (e.key === "Enter") finishAmount();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Type / merchant / category ──────────────────────────────────────
  function setType(type: TransactionType) {
    setValues((prev) => {
      const stillValid = allCategories.some((c) => c.type === type && c.name === prev.category);
      return { ...prev, type, category: stillValid ? prev.category : "Other" };
    });
    if (type === "transfer") setSplitMode(false);
    if (type !== "expense") setFriendSplit(false);
    setDuplicate(null);
  }

  // Smart-fill: a merchant used before brings back its category and wallet
  // (unless they were already picked by hand for this entry).
  function setMerchant(merchant: string) {
    const known = recent.find((r) => r.merchant.toLowerCase() === merchant.trim().toLowerCase() && r.type === values.type);
    patch({
      merchant,
      ...(known && !categoryTouched ? { category: known.category } : {}),
      ...(known && known.walletId !== null && !walletTouched ? { walletId: known.walletId } : {}),
    });
  }

  function repeat(entry: RecentEntry) {
    setValues((prev) => ({
      ...prev,
      type: entry.type,
      direction: entry.direction,
      merchant: entry.merchant,
      category: entry.category,
      walletId: entry.walletId ?? prev.walletId,
      amount: String(entry.amount),
    }));
    setExpr(String(entry.amount));
    setCategoryTouched(true);
    setKeypadOpen(false);
    setDuplicate(null);
    setError(null);
  }

  function categoryOrOther(type: TransactionType, name: string) {
    return allCategories.some((c) => c.type === type && c.name === name) ? name : "Other";
  }

  // ── Scan & voice ────────────────────────────────────────────────────
  function applyPrefill(prefill: Prefill) {
    setValues(prefill.values);
    setExpr(prefill.values.amount);
    setConversion(prefill.conversion);
    setSplitMode(false);
    setFriendSplit(false);
    setCategoryTouched(true);
    setKeypadOpen(false);
    setDuplicate(null);
    setError(null);
    setMoreOpen(Boolean(prefill.values.notes || prefill.values.locationName));
  }

  async function readFile(files: File[], index: number) {
    const previewUrl = URL.createObjectURL(files[index]);
    setCapture({ kind: "scan", status: "busy", files, index, previewUrl });
    const formData = new FormData();
    formData.append("image", await downscaleImage(files[index]));
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

  async function listen(blob: Blob, mimeType: string) {
    setCapture({ kind: "voice", status: "busy", recording: { blob, mimeType } });
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
        setCapture({ kind: "voice", status: "error", error: "Didn't catch a transaction in that. Try again?", recording: { blob, mimeType } });
        return;
      }
      applyPrefill(items[0]);
      setSource({ kind: "voice", items, index: 0, model: typeof data.model === "string" ? data.model : null });
      setCapture({ kind: "none" });
    } catch (err) {
      setCapture({ kind: "voice", status: "error", error: describeFetchError(err, "Voice entry"), recording: { blob, mimeType } });
    }
  }

  function startOver(keep?: ExpenseFormValues) {
    if (source.kind === "scan" && source.previewUrl) URL.revokeObjectURL(source.previewUrl);
    setValues(blankValues(keep?.type ?? values.type, keep?.walletId ?? values.walletId, keep?.date));
    setExpr("");
    setKeypadOpen(true);
    setCategoryTouched(false);
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

  // Next scanned/spoken entry, or the end of the batch.
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
    if (!splitMode && exprTotal === null) {
      setError("Enter an amount first.");
      setKeypadOpen(true);
      return;
    }
    if (!values.merchant.trim()) {
      setError(`Add a ${values.type === "income" ? "source" : values.type === "transfer" ? "description" : "merchant"} first.`);
      document.getElementById("composer-merchant")?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    const base: ExpenseFormValues = { ...values, amount: splitMode ? values.amount : String(exprTotal) };
    const entry: ExpenseFormValues =
      values.type === "expense" && friendSplit && friendIds.length > 0
        ? {
            ...base,
            splitWithFriends: {
              participantIds: friendIds,
              splitMethod: friendMethod,
              customOwed: friendMethod === "custom" ? friendIds.map((id) => ({ userId: id, amount: Number(friendOwed[id]) || 0 })) : undefined,
            },
          }
        : base;
    try {
      let total: number;
      if (splitMode) {
        const saved = await createSplitExpense({ ...entry, splitLines });
        total = saved.reduce((sum, e) => sum + e.amount, 0);
      } else {
        const saved = await createExpense(entry, confirmDuplicate);
        total = saved.amount;
        if (source.kind === "scan" && saved.id > 0) await attachReceipt(saved.id, source.files[source.index]);
      }
      if (entry.splitWithFriends) {
        try {
          await createSplitWithFriends(total, values.merchant, values.date, entry.splitWithFriends);
        } catch (err) {
          // Best-effort: the transaction itself is already saved.
          logAppError("Split with friends", err instanceof Error ? err.message : "Could not create the split with friends.");
        }
      }
      onSaved();
      setLastSaved((prev) => ({ merchant: values.merchant, amount: total, count: (prev?.count ?? 0) + 1 }));
      setDuplicate(null);
      if (source.kind !== "manual") advance();
      else if (addAnother) startOver(values);
      else onDone();
    } catch (err) {
      if (err instanceof DuplicateExpenseError) setDuplicate({ match: err.duplicate, addAnother });
      else setError(err instanceof Error ? err.message : "Could not save that entry.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Pieces ──────────────────────────────────────────────────────────
  const amountCard = (
    <section className={`overflow-hidden rounded-card bg-gradient-to-br text-white shadow-soft transition-colors ${hero.bg}`}>
      <div className="px-4 pt-4 sm:px-5">
        <div className="flex items-center gap-2">
          <div role="group" className="flex flex-1 rounded-full bg-black/15 p-1">
            {(["expense", "income", "transfer"] as TransactionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setType(type)}
                aria-pressed={values.type === type}
                className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition ${
                  values.type === type ? `bg-white shadow-sm ${HERO[type].text}` : "text-white/80 hover:text-white"
                }`}
              >
                {type === "expense" ? t("common.expense") : type === "income" ? t("common.income") : t("common.transfer")}
              </button>
            ))}
          </div>
          {source.kind === "manual" && (
            <>
              <button
                type="button"
                onClick={() => setCapture({ kind: "scan", status: "pick" })}
                aria-label={t("modal.scan")}
                title={t("modal.scan")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 transition hover:bg-black/25"
              >
                <ScanIcon weight="bold" aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => setCapture({ kind: "voice", status: "pick" })}
                aria-label={t("modal.speak")}
                title={t("modal.speak")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 transition hover:bg-black/25"
              >
                <MicrophoneIcon weight="bold" aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>

        {values.type === "transfer" && (
          <div className="mx-auto mt-3 flex max-w-[15rem] rounded-full bg-black/15 p-0.5">
            {(["out", "in"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => patch({ direction: dir })}
                aria-pressed={values.direction === dir}
                className={`flex-1 rounded-full py-1 text-xs font-semibold transition ${values.direction === dir ? "bg-white/90 text-sky-700" : "text-white/80"}`}
              >
                {dir === "out" ? t("form.moneyOut") : t("form.moneyIn")}
              </button>
            ))}
          </div>
        )}

        <button type="button" onClick={() => !splitMode && setKeypadOpen(true)} aria-label={t("form.amount")} className="block w-full py-6 text-center">
          <span className="flex items-baseline justify-center gap-1.5">
            <span className="text-2xl font-semibold text-white/70">{symbol}</span>
            <span className={`font-semibold tabular-nums tracking-tight ${expr.length > 11 ? "text-4xl" : "text-5xl sm:text-6xl"}`}>
              {splitMode ? splitTotal.toFixed(2) : expr || "0"}
            </span>
            {keypadOpen && !splitMode && <span className="ml-0.5 inline-block h-10 w-0.5 animate-pulse self-center bg-white/80" aria-hidden="true" />}
          </span>
          <span className="mt-1 block h-5 text-sm text-white/75">
            {splitMode
              ? t("form.categoriesAndAmounts")
              : hasOperator && exprTotal !== null
                ? `= ${formatCurrency(exprTotal ?? 0, currency)}`
                : !keypadOpen && values.merchant
                  ? `${values.merchant} · ${values.category}`
                  : !keypadOpen
                    ? "Tap to edit"
                    : ""}
          </span>
        </button>
      </div>

      {keypadOpen && !splitMode && (
        <div className="grid grid-cols-4 gap-px bg-black/10 pt-px">
          {KEYS.map((key) =>
            key === "done" ? (
              <button
                key={key}
                type="button"
                onClick={finishAmount}
                aria-label="Done"
                className="flex h-14 items-center justify-center bg-white/95 transition active:bg-white/80"
              >
                <CheckIcon weight="bold" aria-hidden="true" className={`h-5 w-5 ${hero.text}`} />
              </button>
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                aria-label={key === "back" ? "Delete" : key}
                className={`flex h-14 items-center justify-center text-xl font-medium transition active:bg-white/25 ${
                  key === "+" || key === "−" || key === "back" ? "bg-black/10" : "bg-white/10 hover:bg-white/15"
                }`}
              >
                {key === "back" ? <BackspaceIcon weight="bold" aria-hidden="true" className="h-5 w-5" /> : key}
              </button>
            ),
          )}
        </div>
      )}
    </section>
  );

  const capturePanel = capture.kind !== "none" && (
    <section className="rounded-card border border-surface-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-surface-foreground">
          {capture.kind === "scan" ? (
            <ScanIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-amber-500" />
          ) : (
            <MicrophoneIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-violet-500" />
          )}
          {capture.kind === "scan" ? "Scan a receipt or bill" : "Say what you spent or earned"}
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
      {capture.kind === "voice" && capture.status === "pick" && <VoiceRecorder onRecorded={listen} />}
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
              onClick={() => setCapture({ kind: capture.kind, status: "pick" })}
              className="rounded-full px-4 py-2 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              {capture.kind === "scan" ? "Choose another" : "Record again"}
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const sourceBanner = source.kind !== "manual" && (
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
          {queue && queue.of > 1 && (
            <span className="ml-1.5 text-xs font-medium text-surface-foreground-soft">
              {queue.at + 1} / {queue.of}
            </span>
          )}
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
        onClick={() => startOver()}
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
      >
        {t("common.clear")}
      </button>
    </div>
  );

  const repeatRow = source.kind === "manual" && repeatChips.length > 0 && !values.merchant && (
    <div>
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <ArrowClockwiseIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
        Repeat a recent one
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {repeatChips.map((r) => {
          const cat = allCategories.find((c) => c.type === r.type && c.name === r.category);
          return (
            <button
              key={r.merchant}
              type="button"
              onClick={() => repeat(r)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-surface-line bg-surface py-1.5 pl-1.5 pr-3 text-left transition hover:border-surface-accent"
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${badgeClasses(cat?.color)}`}>
                {cat?.icon && isCategoryIconKey(cat.icon) ? (
                  <CategoryIcon iconKey={cat.icon} className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-xs font-semibold">{r.merchant.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span className="max-w-[9rem] truncate text-sm font-medium text-surface-foreground">{r.merchant}</span>
              <span className="text-xs tabular-nums text-surface-foreground-soft">{formatCurrency(r.amount, currency)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const details = (
    <section className="space-y-5 rounded-card border border-surface-line bg-surface p-4 sm:p-5">
      <div>
        <label htmlFor="composer-merchant" className={labelClass}>
          {values.type === "income" ? t("form.source") : values.type === "transfer" ? t("form.description") : t("form.merchant")}
        </label>
        <input
          id="composer-merchant"
          type="text"
          autoComplete="off"
          value={values.merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder={
            values.type === "income"
              ? t("form.merchantPlaceholderIncome")
              : values.type === "transfer"
                ? t("form.merchantPlaceholderTransfer")
                : t("form.merchantPlaceholderExpense")
          }
          className={inputClass}
        />
        {merchantMatches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {merchantMatches.map((m) => (
              <button key={m.merchant} type="button" onClick={() => setMerchant(m.merchant)} className={chipClass(false)}>
                {m.merchant}
              </button>
            ))}
          </div>
        )}
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
          <div className="grid grid-cols-4 gap-1.5">
            {shownCategories.map((c) => {
              const selected = values.category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCategoryTouched(true);
                    patch({ category: c.name });
                  }}
                  aria-pressed={selected}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition ${
                    selected ? "bg-surface-accent/10 ring-2 ring-surface-accent" : "hover:bg-[var(--surface-nav-hover)]"
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${badgeClasses(c.color)}`}>
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
                onClick={() => setAllCats((v) => !v)}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition hover:bg-[var(--surface-nav-hover)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-surface-line text-surface-foreground-soft">
                  <CaretDownIcon weight="bold" aria-hidden="true" className={`h-4 w-4 transition-transform ${allCats ? "rotate-180" : ""}`} />
                </span>
                <span className="w-full truncate text-center text-[11px] font-medium text-surface-foreground-soft">
                  {allCats ? "Less" : `${categories.length - CATEGORY_PREVIEW} more`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <p className={labelClass}>{t("common.date")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPickDate(false);
              patch({ date: today });
            }}
            className={chipClass(values.date === today)}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              setPickDate(false);
              patch({ date: yesterday });
            }}
            className={chipClass(values.date === yesterday)}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setPickDate((v) => !v)}
            className={chipClass(pickDate || (values.date !== today && values.date !== yesterday))}
          >
            <CalendarBlankIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
            {values.date !== today && values.date !== yesterday ? formatDateLong(values.date) : "Pick a date"}
          </button>
        </div>
        {pickDate && (
          <div className="mt-2">
            <DatePicker id="composer-date" value={values.date} onChange={(date) => patch({ date })} required />
          </div>
        )}
      </div>

      {wallets.length > 1 && (
        <div>
          <p className={labelClass}>{t("common.wallet")}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setWalletTouched(true);
                  patch({ walletId: w.id });
                }}
                aria-pressed={walletId === w.id}
                className={chipClass(walletId === w.id)}
              >
                <span className={`h-2 w-2 rounded-full ${dotClasses(w.color)}`} />
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );

  const more = (
    <section className="overflow-hidden rounded-card border border-surface-line bg-surface">
      <button
        type="button"
        onClick={() => setMoreOpen((o) => !o)}
        aria-expanded={moreOpen}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-surface-foreground">More</span>
          <span className="block truncate text-xs text-surface-foreground-soft">
            {[
              values.locationName || "Location",
              values.tags.length ? `${values.tags.length} tag${values.tags.length === 1 ? "" : "s"}` : "tags",
              values.notes ? "note added" : "notes",
              splitMode || friendSplit ? "split on" : "splits",
            ].join(", ")}
          </span>
        </span>
        <CaretDownIcon weight="bold" aria-hidden="true" className={`h-4 w-4 shrink-0 text-surface-foreground-soft transition-transform ${moreOpen ? "rotate-180" : ""}`} />
      </button>
      {moreOpen && (
        <div className="space-y-5 border-t border-surface-line p-4 sm:p-5">
          <LocationField
            labelClass={labelClass}
            value={{ locationName: values.locationName ?? "", latitude: values.latitude ?? null, longitude: values.longitude ?? null }}
            onChange={(loc) => setValues((prev) => ({ ...prev, ...loc }))}
          />
          <div>
            <p className={labelClass}>{t("common.tags")}</p>
            <TagInput tags={values.tags} onChange={(tags) => patch({ tags })} />
          </div>
          <div>
            <label htmlFor="composer-notes" className={labelClass}>
              {t("common.notes")}
            </label>
            <textarea
              id="composer-notes"
              rows={2}
              value={values.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder={t("form.notesPlaceholder")}
              className={`${inputClass} resize-none`}
            />
          </div>
          {values.type !== "transfer" && source.kind === "manual" && (
            <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-soft px-3.5 py-3">
              <span className="flex items-center gap-2.5 text-sm font-medium text-surface-foreground">
                <CopyIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
                {t("form.splitIntoCategories")}
              </span>
              <input
                type="checkbox"
                checked={splitMode}
                onChange={(e) => {
                  setSplitMode(e.target.checked);
                  if (e.target.checked) setKeypadOpen(false);
                }}
                className="h-4 w-4 accent-surface-accent"
              />
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-surface-accent text-white" : "bg-surface text-surface-foreground-soft hover:text-surface-foreground"}`}
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
                            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${friendMethod === m ? "bg-surface-soft text-surface-foreground" : "text-surface-foreground-soft"}`}
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
                          Each of you pays {formatCurrency(amountNumber / (friendIds.length + 1), currency)}, tracked in Split bills.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const saveBar = (
    <div className="sticky bottom-[88px] z-10 sm:bottom-4">
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
              {source.kind === "manual" ? t("common.cancel") : moreInQueue ? "Skip this one" : "Don't add"}
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
      {error && <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 shadow-soft dark:bg-red-950 dark:text-red-400">{error}</p>}
      {lastSaved && source.kind === "manual" && !duplicate && !error && (
        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400" aria-live="polite">
          <CheckIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
          {lastSaved.count > 1 ? `${lastSaved.count} saved` : `Saved ${lastSaved.merchant} · ${formatCurrency(lastSaved.amount, currency)}`}
        </p>
      )}
      <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-soft backdrop-blur-xl">
        {source.kind === "manual" ? (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={submitting || busy}
            className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-50"
          >
            <PlusIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
            Save &amp; new
          </button>
        ) : (
          <button
            type="button"
            onClick={advance}
            disabled={submitting}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground disabled:opacity-50"
          >
            {moreInQueue ? "Skip" : t("common.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || busy}
          className={`flex-1 truncate rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${hero.button}`}
        >
          {submitting ? t("common.saving") : moreInQueue ? "Save & next" : amountNumber > 0 ? `Save ${formatCurrency(amountNumber, currency)}` : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-6"
    >
      {/* Left (desktop) / top (phone): amount, keypad, quick capture. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        {amountCard}
        {capturePanel}
        {sourceBanner}
      </div>
      {/* Right / below: everything else, then the save bar. */}
      <div className="mt-4 flex flex-col gap-4 lg:mt-0">
        {repeatRow}
        {details}
        {more}
        {saveBar}
      </div>
    </form>
  );
}
