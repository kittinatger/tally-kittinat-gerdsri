import type { Budget } from "@/types/budget";
import { monthKey } from "@/lib/format";

type ExpenseLike = { type: string; category: string; date: string; amount: number };

function shiftMonthKey(mk: string, delta: number): string {
  const [y, m] = mk.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(fromKey: string, toKey: string): number {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

// A safety valve, not the effective lookback in the common case — the loop
// below actually starts from the earliest month with real spending in this
// category, so a budget's rollover reflects its whole history rather than
// silently resetting after a fixed window. This just bounds the worst case
// (e.g. years of dense unbroken history) so the computation stays cheap.
const MAX_LOOKBACK_MONTHS = 60;

// Non-rollover budgets simply return their flat monthly limit. Rollover
// budgets compound: each month's effective limit is its own monthlyLimit
// plus whatever was left unspent (never negative) from the previous
// month's effective limit.
export function computeEffectiveBudgetLimit(
  expenses: ExpenseLike[],
  budget: Pick<Budget, "category" | "monthlyLimit" | "rollover">,
  currentMonthKey: string,
): number {
  if (!budget.rollover) return budget.monthlyLimit;

  const spentByMonth = new Map<string, number>();
  for (const e of expenses) {
    if (e.type !== "expense" || e.category !== budget.category) continue;
    const mk = monthKey(e.date);
    spentByMonth.set(mk, (spentByMonth.get(mk) ?? 0) + e.amount);
  }

  const earliest = [...spentByMonth.keys()].sort()[0];
  const monthsOfHistory = earliest ? monthsBetween(earliest, currentMonthKey) : 0;
  const startsAgo = Math.min(MAX_LOOKBACK_MONTHS, Math.max(0, monthsOfHistory));

  let effective = budget.monthlyLimit;
  for (let i = startsAgo; i >= 1; i--) {
    const mk = shiftMonthKey(currentMonthKey, -i);
    const spent = spentByMonth.get(mk) ?? 0;
    const leftover = Math.max(0, effective - spent);
    effective = budget.monthlyLimit + leftover;
  }
  return effective;
}
