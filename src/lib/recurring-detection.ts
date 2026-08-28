import type { Expense } from "@/lib/db";

export type RecurringCandidate = {
  /** Stable id for this suggestion within one response — merchant+category+type,
   * not a DB id (nothing is persisted until the user accepts it). */
  key: string;
  type: string;
  direction: string | null;
  merchant: string;
  category: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  /** Where the next occurrence would land if a rule started today, based on
   * the most recent real occurrence — see advanceFromLastOccurrence below. */
  suggestedNextRunDate: string;
  occurrenceCount: number;
  walletId: number | null;
};

const MIN_OCCURRENCES = 3;
// How much a single amount can differ from the group's median and still
// count as "the same" recurring charge — generous enough for a variable
// utility bill, tight enough not to lump together unrelated purchases at
// the same merchant.
const AMOUNT_TOLERANCE = 0.12;
const MAX_CANDIDATES = 8;

type IntervalBucket = { frequency: "weekly" | "monthly" | "yearly"; targetDays: number; toleranceDays: number };
const BUCKETS: IntervalBucket[] = [
  { frequency: "weekly", targetDays: 7, toleranceDays: 2 },
  { frequency: "monthly", targetDays: 30, toleranceDays: 4 },
  { frequency: "yearly", targetDays: 365, toleranceDays: 10 },
];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Same day-of-month/week clamping logic as advanceDate in db.ts — kept as a
// separate, deliberately simpler copy here since this only ever needs to
// project one step forward from a real past date, not walk a chain of
// skipped occurrences the way the real recurring-rules processor does.
function advanceFromLastOccurrence(dateStr: string, frequency: "weekly" | "monthly" | "yearly"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const toStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (frequency === "weekly") return toStr(new Date(y, m - 1, d + 7));
  if (frequency === "yearly") return toStr(new Date(y + 1, m - 1, d));
  const daysInNextMonth = new Date(y, m + 1, 0).getDate();
  return toStr(new Date(y, m, Math.min(d, daysInNextMonth)));
}

// Scans past transactions for a merchant+category+type+direction that
// repeats on a roughly regular cadence with a roughly consistent amount,
// and proposes it as a recurring rule — a suggestion only; nothing is
// created until the user explicitly accepts one (see
// api/recurring/suggestions/route.ts and RecurringManager.tsx).
//
// Takes db.ts's raw Expense rows (amount as a string, wallet_id
// snake_case) — the same shape listExpenses() returns server-side, not
// the camelCase client-normalized one in types/expense.ts.
export function detectRecurringCandidates(expenses: Expense[]): RecurringCandidate[] {
  const groups = new Map<string, Expense[]>();
  for (const e of expenses) {
    if (e.type === "transfer") continue; // self-transfers/top-ups aren't "recurring bills"
    const merchant = e.merchant.trim();
    if (!merchant) continue;
    const key = `${merchant.toLowerCase()}|${e.category}|${e.type}|${e.direction ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const candidates: RecurringCandidate[] = [];
  for (const [key, group] of groups) {
    if (group.length < MIN_OCCURRENCES) continue;
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : 1));

    const amounts = sorted.map((e) => Number(e.amount));
    const med = median(amounts);
    if (med <= 0) continue;
    const consistentAmounts = amounts.every((a) => Math.abs(a - med) / med <= AMOUNT_TOLERANCE);
    if (!consistentAmounts) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));

    const bucket = BUCKETS.find((b) => gaps.every((g) => Math.abs(g - b.targetDays) <= b.toleranceDays));
    if (!bucket) continue;

    const last = sorted[sorted.length - 1];
    candidates.push({
      key,
      type: last.type,
      direction: last.direction,
      merchant: last.merchant,
      category: last.category,
      amount: med,
      frequency: bucket.frequency,
      suggestedNextRunDate: advanceFromLastOccurrence(last.date, bucket.frequency),
      occurrenceCount: sorted.length,
      walletId: last.wallet_id,
    });
  }

  return candidates.sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, MAX_CANDIDATES);
}
