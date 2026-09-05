"use client";

import { useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, EditIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import ReceiptLightbox from "./ReceiptLightbox";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5V7h-2.5a2 2 0 0 0 0 4H15v.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 11.5v-5Z" />
      <path d="M12.5 8.5h2.75c.414 0 .75.336.75.75v0a.75.75 0 0 1-.75.75H12.5a1 1 0 1 1 0-2Z" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </svg>
  );
}

/**
 * The "ticket" body shared by ExpenseDetailModal (mobile/tablet — wrapped in
 * Modal as a bottom sheet) and ActivitiesView's lg:+ right pane (desktop —
 * rendered inline beside the list, no modal chrome). Keeping this as one
 * component means both surfaces always show the same transaction detail.
 */
export default function ExpenseDetailContent({
  expense,
  onEdit,
  onMerchantClick,
}: {
  expense: Expense;
  onEdit: () => void;
  /** When provided, the merchant name becomes tappable — jumps to that
   * merchant's other transactions (see ActivitiesView.handleMerchantClick).
   * Optional because this content is also used in contexts with no
   * transaction list to jump to. */
  onMerchantClick?: (merchant: string) => void;
}) {
  const t = useT();
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const receiptUrl = `/api/expenses/${expense.id}/receipt`;

  // Same per-type accent language as the Add/Edit ticket: this view is the
  // same ticket, just torn open to read instead of filled in.
  const bandGradientClass =
    expense.type === "income"
      ? "from-emerald-400 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800"
      : expense.type === "expense"
        ? "from-rose-400 to-rose-600 dark:from-rose-600 dark:to-rose-800"
        : "from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-800";
  const editButtonClass =
    expense.type === "income"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : expense.type === "expense"
        ? "bg-rose-500 hover:bg-rose-600"
        : "bg-sky-500 hover:bg-sky-600";
  const tornEdgeStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(135deg, var(--surface) 50%, transparent 50%), linear-gradient(225deg, var(--surface) 50%, transparent 50%)",
    backgroundSize: "14px 14px",
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
  };

  return (
    <div>
      <div className="-mx-5 -mt-1 sm:-mx-6">
        <div className={`bg-gradient-to-br px-5 pb-6 pt-2 text-center text-white sm:px-6 ${bandGradientClass}`}>
          <p className="text-4xl font-bold tabular-nums">
            {signedAmount(expense) >= 0 ? "+" : "-"}
            {formatCurrency(expense.amount, currency)}
          </p>
          {onMerchantClick ? (
            <button
              type="button"
              onClick={() => onMerchantClick(expense.merchant)}
              className="mt-1 text-lg font-semibold text-white/90 underline decoration-white/40 underline-offset-2 transition hover:decoration-white/80"
            >
              {expense.merchant}
            </button>
          ) : (
            <p className="mt-1 text-lg font-semibold text-white/90">{expense.merchant}</p>
          )}
          <span
            className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm`}
          >
            {icon && isCategoryIconKey(icon) ? (
              <CategoryIcon iconKey={icon} className="h-3 w-3" />
            ) : (
              <span className={`h-2 w-2 rounded-full ${dotClasses(color)}`} />
            )}
            {expense.category}
          </span>
        </div>
        <div className="h-3.5" style={tornEdgeStyle} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-accent/10 text-surface-accent">
            <CalendarIcon />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("common.date")}</p>
            <p className="truncate text-sm font-medium text-surface-foreground">{formatDateLong(expense.date)}</p>
          </div>
        </div>
        {expense.walletName && (
          <div className="flex items-center gap-2.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-accent/10 text-surface-accent">
              <WalletIcon />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("common.wallet")}</p>
              <p className="truncate text-sm font-medium text-surface-foreground">{expense.walletName}</p>
            </div>
          </div>
        )}
      </div>

      {expense.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3">
          {expense.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClasses(color)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {expense.notes && (
        <div className="mt-2.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{t("common.notes")}</p>
          <p className="whitespace-pre-wrap text-sm text-surface-foreground">{expense.notes}</p>
        </div>
      )}

      {expense.hasReceipt && (
        <button
          type="button"
          onClick={() => setViewingReceipt(true)}
          className="mt-2.5 flex w-full items-center gap-3 rounded-card border border-surface-line bg-surface-soft p-3 text-left transition hover:border-surface-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={receiptUrl} alt="Receipt" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-surface-foreground">
            <ReceiptIcon />
            {t("activities.viewReceipt")}
          </span>
        </button>
      )}

      {viewingReceipt && <ReceiptLightbox src={receiptUrl} onClose={() => setViewingReceipt(false)} />}

      <button
        type="button"
        onClick={onEdit}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition ${editButtonClass}`}
      >
        <EditIcon />
        {t("modal.editTransaction")}
      </button>
    </div>
  );
}
