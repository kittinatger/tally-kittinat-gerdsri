import type { Budget } from "@/types/budget";
import { monthKey } from "@/lib/format";

type ExpenseLike = { type: string; category: string; date: string; amount: number };

function shiftMonthKey(mk: string, delta: number): string {
  const [y, m] = mk.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Non-rollover budgets simply return their flat monthly limit. Rollover
// budgets compound: each month's effective limit is its own monthlyLimit
// plus whatever was left unspent (never negative) from the previous
// month's effective limit — walked back up to 12 months so a long-lived
// budget doesn't require scanning a user's entire transaction history.
export function computeEffectiveBudgetLimit(
  expenses: ExpenseLike[],
  budget: Pick<Budget, "category" | "monthlyLimit" | "rollover">,
  currentMonthKey: string,
): number {
  if (!budget.rollover) return budget.monthlyLimit;

  let effective = budget.monthlyLimit;
  for (let i = 12; i >= 1; i--) {
    const mk = shiftMonthKey(currentMonthKey, -i);
    const spent = expenses
      .filter((e) => e.type === "expense" && e.category === budget.category && monthKey(e.date) === mk)
      .reduce((sum, e) => sum + e.amount, 0);
    const leftover = Math.max(0, effective - spent);
    effective = budget.monthlyLimit + leftover;
  }
  return effective;
}
