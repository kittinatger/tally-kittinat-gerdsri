import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { SUMMARY_CARDS, type SummaryCardId } from "@/lib/dashboard-widgets";
import IncomeStatCard from "./IncomeStatCard";
import ExpenseStatCard from "./ExpenseStatCard";
import BalanceStatCard from "./BalanceStatCard";

export default function SummaryCards({
  expenses,
  remaining,
  cards = SUMMARY_CARDS,
  onEditBalance,
  onAddIncome,
  onAddExpense,
}: {
  expenses: Expense[];
  remaining: number;
  cards?: readonly SummaryCardId[];
  /** Omit (or leave undefined) to hide that card's quick-action button, making it display-only. */
  onEditBalance?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}) {
  const currency = useCurrency();
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);

  const monthIncome = thisMonth.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const monthSpent = thisMonth.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

  const visible = cards.length > 0 ? cards : SUMMARY_CARDS;
  const gridColsClass = visible.length === 1 ? "grid-cols-1" : visible.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className={`mb-6 grid gap-3 ${gridColsClass}`}>
      {visible.includes("expenses") && (
        <ExpenseStatCard label="Expenses" value={formatCurrency(monthSpent, currency)} currencyCode={currency} onClick={onAddExpense} />
      )}
      {visible.includes("income") && (
        <IncomeStatCard label="Income" value={formatCurrency(monthIncome, currency)} currencyCode={currency} onClick={onAddIncome} />
      )}
      {visible.includes("remaining") && (
        <BalanceStatCard
          label="Remaining"
          value={`${remaining < 0 ? "-" : ""}${formatCurrency(Math.abs(remaining), currency)}`}
          currencyCode={currency}
          negative={remaining < 0}
          onClick={onEditBalance}
        />
      )}
    </div>
  );
}
