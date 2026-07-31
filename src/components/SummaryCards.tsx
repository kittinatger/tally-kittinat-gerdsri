import type { Expense } from "@/types/expense";
import { formatCurrency, monthKey, todayInputValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";

export default function SummaryCards({
  expenses,
  remaining,
  onEditBalance,
  onAddIncome,
  onAddExpense,
}: {
  expenses: Expense[];
  remaining: number;
  onEditBalance: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  const currency = useCurrency();
  const currentMonthKey = monthKey(todayInputValue());
  const thisMonth = expenses.filter((e) => monthKey(e.date) === currentMonthKey);

  const monthIncome = thisMonth.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const monthSpent = thisMonth.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <button
        onClick={onAddIncome}
        className="rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Income</p>
          <svg viewBox="0 0 30.0684 29.5277" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft">
            <path d="M22.041 4.28789L20.4382 5.89177L9.0381 5.89177C6.82131 5.89177 5.57131 7.14177 5.57131 9.35856L5.57131 20.9894C5.57131 23.216 6.82131 24.466 9.0381 24.466L20.669 24.466C22.8858 24.466 24.1358 23.216 24.1358 20.9894L24.1358 9.66867L25.7512 8.05092C25.8276 8.4579 25.8643 8.89852 25.8643 9.36833L25.8643 20.9894C25.8643 24.3293 24.0088 26.1945 20.669 26.1945L9.0381 26.1945C5.69826 26.1945 3.84279 24.3293 3.84279 20.9894L3.84279 9.36833C3.84279 6.02848 5.69826 4.16325 9.0381 4.16325L20.669 4.16325C21.1602 4.16325 21.6193 4.2036 22.041 4.28789Z" />
            <path d="M12.4463 17.9133L14.7119 16.9074L26.46 5.15934L24.9072 3.61638L13.169 15.3644L12.1045 17.5617C12.0069 17.7472 12.2412 18.0011 12.4463 17.9133ZM27.3487 4.2902L28.1983 3.4113C28.6084 2.99138 28.6182 2.45427 28.2178 2.05388L27.9737 1.80973C27.6026 1.43864 27.0459 1.48747 26.6553 1.87809L25.7959 2.7277Z" />
          </svg>
        </div>
        <p className="mt-1.5 font-display text-xl text-emerald-600 dark:text-emerald-400 sm:text-2xl">
          {formatCurrency(monthIncome, currency)}
        </p>
      </button>
      <button
        onClick={onAddExpense}
        className="rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Expenses</p>
          <svg viewBox="0 0 30.0684 29.5277" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft">
            <path d="M22.041 4.28789L20.4382 5.89177L9.0381 5.89177C6.82131 5.89177 5.57131 7.14177 5.57131 9.35856L5.57131 20.9894C5.57131 23.216 6.82131 24.466 9.0381 24.466L20.669 24.466C22.8858 24.466 24.1358 23.216 24.1358 20.9894L24.1358 9.66867L25.7512 8.05092C25.8276 8.4579 25.8643 8.89852 25.8643 9.36833L25.8643 20.9894C25.8643 24.3293 24.0088 26.1945 20.669 26.1945L9.0381 26.1945C5.69826 26.1945 3.84279 24.3293 3.84279 20.9894L3.84279 9.36833C3.84279 6.02848 5.69826 4.16325 9.0381 4.16325L20.669 4.16325C21.1602 4.16325 21.6193 4.2036 22.041 4.28789Z" />
            <path d="M12.4463 17.9133L14.7119 16.9074L26.46 5.15934L24.9072 3.61638L13.169 15.3644L12.1045 17.5617C12.0069 17.7472 12.2412 18.0011 12.4463 17.9133ZM27.3487 4.2902L28.1983 3.4113C28.6084 2.99138 28.6182 2.45427 28.2178 2.05388L27.9737 1.80973C27.6026 1.43864 27.0459 1.48747 26.6553 1.87809L25.7959 2.7277Z" />
          </svg>
        </div>
        <p className="mt-1.5 font-display text-xl text-red-600 dark:text-red-400 sm:text-2xl">
          {formatCurrency(monthSpent, currency)}
        </p>
      </button>
      <button
        onClick={onEditBalance}
        className="rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
      >
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Remaining</p>
          <svg
            viewBox="0 0 20.3949 19.9823"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft"
          >
            <path d="M3.24919 18.8046L17.3312 4.74211L15.3293 2.73039L1.24723 16.7929L0.0265306 19.4882C-0.0906569 19.7616 0.202312 20.0741 0.475749 19.957ZM18.3761 3.72649L19.5578 2.55461C20.1632 1.94914 20.1925 1.31438 19.6554 0.777268L19.3039 0.425706C18.7765-0.101638 18.132-0.0528096 17.5363 0.533128L16.3449 1.705Z" />
          </svg>
        </div>
        <p
          className={`mt-1.5 font-display text-xl sm:text-2xl ${
            remaining >= 0 ? "text-surface-accent" : "text-red-600 dark:text-red-400"
          }`}
        >
          {remaining < 0 ? "-" : ""}
          {formatCurrency(Math.abs(remaining), currency)}
        </p>
      </button>
    </div>
  );
}
