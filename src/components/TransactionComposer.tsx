"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownLeftIcon,
  ArrowsLeftRightIcon,
  ArrowUpRightIcon,
  BackspaceIcon,
  CalendarBlankIcon,
  CheckIcon,
  CopyIcon,
  KeyboardIcon,
  MapPinIcon,
  MicrophoneIcon,
  NotePencilIcon,
  PlusIcon,
  ScanIcon,
  SparkleIcon,
  StorefrontIcon,
  TagIcon,
  UsersThreeIcon,
  WalletIcon,
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

type Extra = "location" | "tags" | "notes";

// Each type's accent: the page itself stays neutral and only these touches
// (tab underline, readout, operator keys, save button) carry the colour.
const TONE: Record<
  TransactionType,
  { icon: typeof ArrowUpRightIcon; text: string; solid: string; hover: string; soft: string; border: string; wash: string }
> = {
  expense: {
    icon: ArrowUpRightIcon,
    text: "text-rose-600 dark:text-rose-400",
    solid: "bg-rose-500",
    hover: "hover:bg-rose-600",
    soft: "bg-rose-500/10",
    border: "border-rose-400/70",
    wash: "bg-gradient-to-b from-rose-500/[0.06] to-transparent",
  },
  income: {
    icon: ArrowDownLeftIcon,
    text: "text-emerald-600 dark:text-emerald-400",
    solid: "bg-emerald-500",
    hover: "hover:bg-emerald-600",
    soft: "bg-emerald-500/10",
    border: "border-emerald-400/70",
    wash: "bg-gradient-to-b from-emerald-500/[0.06] to-transparent",
  },
  transfer: {
    icon: ArrowsLeftRightIcon,
    text: "text-sky-600 dark:text-sky-400",
    solid: "bg-sky-500",
    hover: "hover:bg-sky-600",
    soft: "bg-sky-500/10",
    border: "border-sky-400/70",
    wash: "bg-gradient-to-b from-sky-500/[0.06] to-transparent",
  },
};

const inputClass =
  "w-full rounded-xl border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition placeholder:text-surface-foreground-soft/60 focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft";
const pillClass = (on: boolean) =>
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
 * fill the same form; location, tags, notes and splits are opt-in chips. A likely
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
  // Starts collapsed: the page opens showing the whole form, and tapping
  // the amount brings the keypad up.
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [walletTouched, setWalletTouched] = useState(initialWalletId !== null);
  const [source, setSource] = useState<Source>({ kind: "manual" });
  const [capture, setCapture] = useState<Capture>({ kind: "none" });
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [allCats, setAllCats] = useState(false);
  const [pickDate, setPickDate] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
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

  const tone = TONE[values.type];
  const symbol = currencySymbol(currency);
  const categories = useMemo(() => allCategories.filter((c) => c.type === values.type), [allCategories, values.type]);
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
    // Open the extras that the scan/voice filled in, so they get checked.
    setExtras([...(prefill.values.locationName ? (["location"] as const) : []), ...(prefill.values.notes ? (["notes"] as const) : [])]);
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
  const typeLabel = (type: TransactionType) =>
    type === "expense" ? t("common.expense") : type === "income" ? t("common.income") : t("common.transfer");
  const selectedCategory = categories.find((c) => c.name === values.category);
  const merchantLabel = values.type === "income" ? t("form.source") : values.type === "transfer" ? t("form.description") : t("form.merchant");

  function toggleExtra(extra: Extra) {
    setExtras((prev) => (prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]));
  }

  // The amount "display": type tabs on top, a calculator-style readout and
  // a neutral keypad, with Scan / Speak as a footer.
  const amountPanel = (
    <section className="overflow-hidden rounded-card border border-surface-line bg-surface shadow-soft">
      <div role="group" aria-label="Transaction type" className="grid grid-cols-3 border-b border-surface-line">
        {(["expense", "income", "transfer"] as TransactionType[]).map((type) => {
          const on = values.type === type;
          const Icon = TONE[type].icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setType(type)}
              aria-pressed={on}
              className={`relative flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition ${
                on ? TONE[type].text : "text-surface-foreground-soft hover:text-surface-foreground"
              }`}
            >
              <Icon weight="bold" aria-hidden="true" className="h-4 w-4" />
              {typeLabel(type)}
              <span className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition ${on ? TONE[type].solid : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className={`relative px-5 pb-4 pt-4 transition-colors ${tone.wash}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("form.amount")}</span>
          {values.type === "transfer" ? (
            <div className="flex rounded-full bg-surface-soft p-0.5">
              {(["out", "in"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => patch({ direction: dir })}
                  aria-pressed={values.direction === dir}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    values.direction === dir ? `bg-surface shadow-sm ${tone.text}` : "text-surface-foreground-soft"
                  }`}
                >
                  {dir === "out" ? t("form.moneyOut") : t("form.moneyIn")}
                </button>
              ))}
            </div>
          ) : (
            <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-semibold text-surface-foreground-soft">{currency}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => !splitMode && setKeypadOpen(true)}
          aria-label={t("form.amount")}
          className="mt-2 block w-full text-right"
        >
          <span className="flex items-baseline justify-end gap-1.5">
            <span className="text-2xl font-medium text-surface-foreground-soft">{symbol}</span>
            <span className={`font-semibold tabular-nums tracking-tight ${tone.text} ${expr.length > 11 ? "text-4xl" : "text-5xl sm:text-6xl"}`}>
              {splitMode ? splitTotal.toFixed(2) : expr || "0"}
            </span>
            {keypadOpen && !splitMode && <span className={`ml-0.5 inline-block h-10 w-0.5 animate-pulse self-center ${tone.solid}`} aria-hidden="true" />}
          </span>
          <span className="mt-1 block h-5 truncate text-sm text-surface-foreground-soft">
            {splitMode
              ? t("form.categoriesAndAmounts")
              : hasOperator && exprTotal !== null
                ? `= ${formatCurrency(exprTotal ?? 0, currency)}`
                : !keypadOpen
                  ? exprTotal === null
                    ? "Tap to enter an amount"
                    : "Tap to edit"
                  : ""}
          </span>
        </button>
      </div>

      {keypadOpen && !splitMode && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {KEYS.map((key) => {
              if (key === "done")
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={finishAmount}
                    aria-label="Done"
                    className={`flex h-12 items-center justify-center rounded-xl text-white transition active:scale-95 sm:h-13 ${tone.solid}`}
                  >
                    <CheckIcon weight="bold" aria-hidden="true" className="h-5 w-5" />
                  </button>
                );
              const op = key === "+" || key === "−" || key === "back";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  aria-label={key === "back" ? "Delete" : key}
                  className={`flex h-12 items-center justify-center rounded-xl text-xl font-medium transition active:scale-95 sm:h-13 ${
                    op ? `${tone.soft} ${tone.text}` : "bg-surface-soft text-surface-foreground hover:bg-[var(--surface-nav-hover)]"
                  }`}
                >
                  {key === "back" ? <BackspaceIcon weight="bold" aria-hidden="true" className="h-5 w-5" /> : key}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="hidden items-center gap-1.5 text-[11px] text-surface-foreground-soft lg:flex">
              <KeyboardIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
              Type with your keyboard · Enter to finish
            </span>
            {expr && (
              <button
                type="button"
                onClick={() => setExpr("")}
                className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
              >
                {t("common.clear")}
              </button>
            )}
          </div>
        </div>
      )}

      {source.kind === "manual" && (
        <div className="grid grid-cols-2 divide-x divide-surface-line border-t border-surface-line">
          <button
            type="button"
            onClick={() => setCapture({ kind: "scan", status: "pick" })}
            aria-pressed={capture.kind === "scan"}
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
          >
            <ScanIcon weight="bold" aria-hidden="true" className="h-[18px] w-[18px] text-amber-500" />
            {t("modal.scan")}
          </button>
          <button
            type="button"
            onClick={() => setCapture({ kind: "voice", status: "pick" })}
            aria-pressed={capture.kind === "voice"}
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
          >
            <MicrophoneIcon weight="bold" aria-hidden="true" className="h-[18px] w-[18px] text-violet-500" />
            {t("modal.speak")}
          </button>
        </div>
      )}
    </section>
  );

  const capturePanel = capture.kind !== "none" && (
    <section className="rounded-card border border-dashed border-surface-line bg-surface p-4 sm:p-5">
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

  // Batch progress for scans/voice: a thumbnail, "2 / 5" and a step bar.
  const sourceBanner = source.kind !== "manual" && (
    <div className="overflow-hidden rounded-card border border-surface-line bg-surface">
      <div className="flex items-center gap-3 p-3">
        {source.kind === "scan" && source.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={source.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
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
      {queue && queue.of > 1 && (
        <div className="flex gap-1 px-3 pb-3" aria-hidden="true">
          {Array.from({ length: queue.of }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i < queue.at ? "bg-emerald-500" : i === queue.at ? (source.kind === "scan" ? "bg-amber-500" : "bg-violet-500") : "bg-surface-soft"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Recent merchants as small two-line tiles; one tap fills everything.
  const repeatRow = source.kind === "manual" && repeatChips.length > 0 && !values.merchant && (
    <div>
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
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
              className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-surface-line bg-surface p-3 text-left transition hover:-translate-y-0.5 hover:border-surface-accent"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${badgeClasses(cat?.color)}`}>
                {cat?.icon && isCategoryIconKey(cat.icon) ? (
                  <CategoryIcon iconKey={cat.icon} className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{r.merchant.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-surface-foreground">{r.merchant}</span>
                <span className="block text-xs tabular-nums text-surface-foreground-soft">{formatCurrency(r.amount, currency)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // The details as one grouped list: an icon gutter and a field per row.
  const details = (
    <section className="divide-y divide-surface-line rounded-card border border-surface-line bg-surface">
      <FieldRow icon={<StorefrontIcon weight="bold" className="h-[18px] w-[18px]" />} label={merchantLabel} htmlFor="composer-merchant">
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
          className="w-full bg-transparent text-base font-medium text-surface-foreground outline-none placeholder:font-normal placeholder:text-surface-foreground-soft/60"
        />
        {merchantMatches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {merchantMatches.map((m) => (
              <button key={m.merchant} type="button" onClick={() => setMerchant(m.merchant)} className={pillClass(false)}>
                <SparkleIcon weight="fill" aria-hidden="true" className="h-3 w-3 text-surface-accent" />
                {m.merchant}
              </button>
            ))}
          </div>
        )}
      </FieldRow>

      {splitMode ? (
        <FieldRow icon={<CopyIcon weight="bold" className="h-[18px] w-[18px]" />} label={t("form.categoriesAndAmounts")}>
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
        </FieldRow>
      ) : (
        <FieldRow
          icon={
            selectedCategory?.icon && isCategoryIconKey(selectedCategory.icon) ? (
              <CategoryIcon iconKey={selectedCategory.icon} className="h-[18px] w-[18px]" />
            ) : (
              <TagIcon weight="bold" className="h-[18px] w-[18px]" />
            )
          }
          iconClass={selectedCategory ? badgeClasses(selectedCategory.color) : undefined}
          label={t("common.category")}
          action={
            categories.length > 4 && (
              <button type="button" onClick={() => setAllCats((v) => !v)} className="text-xs font-semibold text-surface-accent hover:underline">
                {allCats ? "Less" : "Show all"}
              </button>
            )
          }
        >
          {/* A single scrolling row, or every category wrapped with "Show all". */}
          <div className={allCats ? "flex flex-wrap gap-1.5" : "-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"}>
            {categories.map((c) => {
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
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition ${
                    selected ? `${tone.border} ${tone.soft} text-surface-foreground` : "border-surface-line text-surface-foreground-soft hover:text-surface-foreground"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${badgeClasses(c.color)}`}>
                    {c.icon && isCategoryIconKey(c.icon) ? (
                      <CategoryIcon iconKey={c.icon} className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[11px] font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </FieldRow>
      )}

      <FieldRow icon={<CalendarBlankIcon weight="bold" className="h-[18px] w-[18px]" />} label={t("common.date")}>
        <div className="flex rounded-xl bg-surface-soft p-1">
          {[
            { label: "Today", on: values.date === today && !pickDate, onClick: () => { setPickDate(false); patch({ date: today }); } },
            { label: "Yesterday", on: values.date === yesterday && !pickDate, onClick: () => { setPickDate(false); patch({ date: yesterday }); } },
            {
              label: values.date !== today && values.date !== yesterday ? formatDateLong(values.date) : "Pick a date",
              on: pickDate || (values.date !== today && values.date !== yesterday),
              onClick: () => setPickDate((v) => !v),
            },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onClick}
              aria-pressed={opt.on}
              className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                opt.on ? "bg-surface text-surface-foreground shadow-sm" : "text-surface-foreground-soft hover:text-surface-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {pickDate && (
          <div className="mt-2">
            <DatePicker id="composer-date" value={values.date} onChange={(date) => patch({ date })} required />
          </div>
        )}
      </FieldRow>

      {wallets.length > 1 && (
        <FieldRow icon={<WalletIcon weight="bold" className="h-[18px] w-[18px]" />} label={t("common.wallet")}>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setWalletTouched(true);
                  patch({ walletId: w.id });
                }}
                aria-pressed={walletId === w.id}
                className={pillClass(walletId === w.id)}
              >
                <span className={`h-2 w-2 rounded-full ${dotClasses(w.color)}`} />
                {w.name}
              </button>
            ))}
          </div>
        </FieldRow>
      )}
    </section>
  );

  // Extras: each is its own toggle chip that opens just that editor, and
  // shows a dot once it holds something.
  const canSplit = values.type !== "transfer" && source.kind === "manual";
  const canFriendSplit = values.type === "expense" && friends.length > 0;
  const extraChip = (key: string, on: boolean, filled: boolean, icon: ReactNode, label: string, onClick: () => void) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on} className={pillClass(on)}>
      {icon}
      {label}
      {filled && !on && <span className="h-1.5 w-1.5 rounded-full bg-surface-accent" aria-hidden="true" />}
    </button>
  );
  const extrasCard = (
    <section className="rounded-card border border-surface-line bg-surface p-4 sm:p-5">
      <p className={labelClass}>Add details</p>
      <div className="flex flex-wrap gap-1.5">
        {extraChip("location", extras.includes("location"), Boolean(values.locationName), <MapPinIcon weight="bold" aria-hidden="true" className="h-4 w-4" />, "Location", () =>
          toggleExtra("location"),
        )}
        {extraChip("tags", extras.includes("tags"), values.tags.length > 0, <TagIcon weight="bold" aria-hidden="true" className="h-4 w-4" />, t("common.tags"), () =>
          toggleExtra("tags"),
        )}
        {extraChip("notes", extras.includes("notes"), Boolean(values.notes), <NotePencilIcon weight="bold" aria-hidden="true" className="h-4 w-4" />, t("common.notes"), () =>
          toggleExtra("notes"),
        )}
        {canSplit &&
          extraChip("split", splitMode, false, <CopyIcon weight="bold" aria-hidden="true" className="h-4 w-4" />, t("form.splitIntoCategories"), () => {
            setSplitMode((v) => !v);
            if (!splitMode) setKeypadOpen(false);
          })}
        {canFriendSplit &&
          extraChip("friends", friendSplit, false, <UsersThreeIcon weight="bold" aria-hidden="true" className="h-4 w-4" />, "Split with friends", () =>
            setFriendSplit((v) => !v),
          )}
      </div>

      {extras.includes("location") && (
        <div className="mt-4">
          <LocationField
            labelClass={labelClass}
            value={{ locationName: values.locationName ?? "", latitude: values.latitude ?? null, longitude: values.longitude ?? null }}
            onChange={(loc) => setValues((prev) => ({ ...prev, ...loc }))}
          />
        </div>
      )}
      {extras.includes("tags") && (
        <div className="mt-4">
          <p className={labelClass}>{t("common.tags")}</p>
          <TagInput tags={values.tags} onChange={(tags) => patch({ tags })} />
        </div>
      )}
      {extras.includes("notes") && (
        <div className="mt-4">
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
      )}
      {canFriendSplit && friendSplit && (
        <div className="mt-4 rounded-xl bg-surface-soft p-3.5">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-surface-foreground">
            <UsersThreeIcon weight="bold" aria-hidden="true" className="h-4 w-4 text-surface-foreground-soft" />
            Split this bill with friends
          </p>
          <div className="space-y-3">
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
        </div>
      )}
    </section>
  );

  // The dock: one compact, solid row resting on the phone's bottom nav
  // (about 58px plus the home-indicator padding, see globals.css) so it never
  // overlaps or clips it, on a fade of the page background so scrolled
  // content doesn’t show through the gap above the nav. Warnings and errors stack above it.
  const saveDock = (
    <div className="sticky bottom-[calc(58px+var(--mobile-nav-bottom-pad,10px))] z-10 -mx-1 bg-gradient-to-t from-background from-60% to-transparent px-1 pb-3 pt-4 sm:bottom-0 sm:pb-4">
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
      <div className="flex items-center gap-2 rounded-2xl border border-surface-line bg-surface p-1.5 shadow-soft">
        {source.kind === "manual" ? (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={submitting || busy}
            aria-label="Save and add another"
            title="Save and add another"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-surface-soft px-3.5 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)] disabled:opacity-50"
          >
            <PlusIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
            New
          </button>
        ) : (
          <button
            type="button"
            onClick={advance}
            disabled={submitting}
            className="flex h-11 shrink-0 items-center rounded-xl bg-surface-soft px-4 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)] disabled:opacity-50"
          >
            {moreInQueue ? "Skip" : t("common.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || busy}
          className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-60 ${tone.solid} ${tone.hover}`}
        >
          {submitting ? (
            t("common.saving")
          ) : (
            <>
              <CheckIcon weight="bold" aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {moreInQueue ? "Save & next" : amountNumber > 0 ? `Save ${formatCurrency(amountNumber, currency)}` : "Save"}
              </span>
            </>
          )}
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
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6"
    >
      {/* Left (desktop) / top (phone): the amount display, keypad and capture. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        {amountPanel}
        {capturePanel}
        {sourceBanner}
      </div>
      {/* Right / below: recents, the details list, extras, then the dock. */}
      <div className="mt-4 flex flex-col gap-4 lg:mt-0">
        {repeatRow}
        {details}
        {extrasCard}
        {saveDock}
      </div>
    </form>
  );
}

// One row of the details list: a tinted icon tile, a small label (with an
// optional action on the right) and the field itself.
function FieldRow({
  icon,
  iconClass,
  label,
  htmlFor,
  action,
  children,
}: {
  icon: ReactNode;
  iconClass?: string;
  label: string;
  htmlFor?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-3.5 sm:px-5">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass ?? "bg-surface-soft text-surface-foreground-soft"}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">
              {label}
            </label>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
          )}
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
