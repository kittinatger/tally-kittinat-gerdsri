"use client";

import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import Modal from "./Modal";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-surface-foreground-soft">{label}</span>
      <span className="text-right text-sm font-medium text-surface-foreground">{children}</span>
    </div>
  );
}

export default function ExpenseDetailModal({
  expense,
  onClose,
  onEdit,
}: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
}) {
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();

  const amountClass =
    expense.type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : expense.type === "transfer"
        ? "text-surface-foreground"
        : "text-red-600 dark:text-red-400";

  return (
    <Modal onClose={onClose} title="Transaction details">
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        <p className={`text-4xl font-bold tabular-nums ${amountClass}`}>
          {signedAmount(expense) >= 0 ? "+" : "-"}
          {formatCurrency(expense.amount, currency)}
        </p>
        <p className="text-lg font-semibold text-surface-foreground">{expense.merchant}</p>
      </div>

      {expense.hasReceipt && (
        <a
          href={`/api/expenses/${expense.id}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-card bg-surface-soft p-3 transition hover:bg-[var(--surface-nav-hover)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/expenses/${expense.id}/receipt`}
            alt="Receipt"
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <span className="text-sm font-semibold text-surface-foreground">View original receipt</span>
        </a>
      )}

      <div className="divide-y divide-surface-line rounded-card border border-surface-line bg-surface-soft px-4">
        <DetailRow label="Category">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(color)}`}>
            {icon ? (
              <span>{icon}</span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${dotClasses(color)}`} />
            )}
            {expense.category}
          </span>
        </DetailRow>
        <DetailRow label="Date">{formatDateLong(expense.date)}</DetailRow>
        {expense.walletName && <DetailRow label="Wallet">{expense.walletName}</DetailRow>}
        {expense.tags.length > 0 && (
          <DetailRow label="Tags">
            <span className="flex flex-wrap justify-end gap-1">
              {expense.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--surface-nav-hover)] px-2 py-0.5 text-[11px] font-medium text-surface-foreground-soft"
                >
                  #{tag}
                </span>
              ))}
            </span>
          </DetailRow>
        )}
      </div>

      {expense.notes && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-surface-foreground">{expense.notes}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-surface-accent px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-surface-accent-dark"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
        </svg>
        Edit transaction
      </button>
    </Modal>
  );
}
