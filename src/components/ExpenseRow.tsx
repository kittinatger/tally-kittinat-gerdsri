"use client";

import { useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, TrashIcon, EditIcon } from "@/lib/icons";

const OPEN_DELETE = -76;
const OPEN_SHARE = 76;
const MOVE_THRESHOLD = 6;

function DeleteIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <TrashIcon className={className} />;
}

function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 12.5V3.5M6.5 7 10 3.5 13.5 7" />
      <path d="M4 10.5v4a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-4" />
    </svg>
  );
}

async function shareExpense(expense: Expense, currency: string) {
  const amount = `${signedAmount(expense) >= 0 ? "+" : "-"}${formatCurrency(expense.amount, currency)}`;
  const text = `${expense.merchant} — ${amount} (${expense.category}, ${formatDateLong(expense.date)})`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // User cancelled the share sheet, or it's unsupported for this
      // content — fall through to clipboard so the swipe action still does
      // something useful.
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text).catch(() => {});
  }
}

export default function ExpenseRow({
  expense,
  onClick,
  onDelete,
  onEdit,
  isLast,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  expense: Expense;
  onClick: () => void;
  /** Enables swipe-left-to-delete when provided (Activities list only). */
  onDelete?: (id: number) => void;
  /** Enables the sm:+ hover-revealed Edit button (desktop mouse users don't
   * have a reason to discover the swipe gesture — see ShareIcon/DeleteIcon
   * below, which get the same hover treatment). */
  onEdit?: (expense: Expense) => void;
  isLast: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();

  const [restX, setRestX] = useState(0);
  const [liveX, setLiveX] = useState(0);
  const [gestureStartX, setGestureStartX] = useState<number | null>(null);
  const [moved, setMoved] = useState(false);
  const swipeEnabled = Boolean(onDelete) && !selectMode;
  // Swipe stays available everywhere (it's how touch users reach these
  // actions), but a mouse user has no reason to know to drag a row — so
  // sm:+ also gets a conventional hover-revealed button cluster as the
  // discoverable path. Both can coexist since hover never fires on touch.
  const showHoverActions = !selectMode && Boolean(onDelete || onEdit);

  function closeSwipe() {
    setRestX(0);
    setLiveX(0);
  }

  function handlePointerDown(e: React.PointerEvent) {
    setGestureStartX(e.clientX);
    setMoved(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (gestureStartX === null) return;
    const delta = e.clientX - gestureStartX;
    if (Math.abs(delta) > MOVE_THRESHOLD) setMoved(true);
    if (swipeEnabled) {
      setLiveX(Math.max(OPEN_DELETE, Math.min(OPEN_SHARE, restX + delta)));
    }
  }

  function handlePointerUp() {
    if (gestureStartX === null) return;
    if (!moved) {
      if (restX !== 0) {
        closeSwipe();
      } else if (selectMode) {
        onToggleSelect?.();
      } else {
        onClick();
      }
    } else if (swipeEnabled) {
      let next = 0;
      if (liveX <= OPEN_DELETE / 2) next = OPEN_DELETE;
      else if (liveX >= OPEN_SHARE / 2) next = OPEN_SHARE;
      setRestX(next);
      setLiveX(next);
    }
    setGestureStartX(null);
  }

  function handleDelete() {
    closeSwipe();
    onDelete?.(expense.id);
  }

  async function handleShare() {
    closeSwipe();
    await shareExpense(expense, currency);
  }

  function handleHoverEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit?.(expense);
  }

  function handleHoverShare(e: React.MouseEvent) {
    e.stopPropagation();
    shareExpense(expense, currency);
  }

  function handleHoverDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(expense.id);
  }

  return (
    <div className={`group relative overflow-hidden ${isLast ? "" : "border-b border-surface-line"}`}>
      {swipeEnabled && (
        <div className="absolute inset-y-0 left-0 right-0 flex items-stretch justify-between">
          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share ${expense.merchant}`}
            className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 bg-sky-500 text-xs font-semibold text-white"
          >
            <ShareIcon />
            Share
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${expense.merchant}`}
            className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 bg-red-600 text-xs font-semibold text-white"
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      )}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${liveX}px)`, touchAction: swipeEnabled ? "pan-y" : undefined }}
        className={`relative flex w-full items-center justify-between gap-3 bg-surface px-4 py-3.5 text-left ${
          gestureStartX === null ? "transition-transform" : ""
        } hover:bg-[var(--surface-nav-hover)] ${selected ? "bg-[var(--surface-nav-hover)]" : ""} ${
          showHoverActions ? "sm:pr-28" : ""
        }`}
      >
        {selectMode && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? "border-surface-accent bg-surface-accent text-white" : "border-surface-line"
            }`}
          >
            {selected && (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M4 10l4 4 8-8" />
              </svg>
            )}
          </span>
        )}
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${badgeClasses(color)}`}
        >
          {icon && isCategoryIconKey(icon) ? (
            <CategoryIcon iconKey={icon} className="h-5 w-5" />
          ) : (
            <span className="text-lg">{expense.category.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-surface-foreground">{expense.merchant}</p>
          <p className="mt-0.5 truncate text-xs text-surface-foreground-soft">
            {expense.category} · {formatDateLong(expense.date)}
          </p>
          {expense.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {expense.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--surface-nav-hover)] px-2 py-0.5 text-[11px] font-medium text-surface-foreground-soft"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <p
          className={`shrink-0 font-semibold ${
            expense.type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : expense.type === "transfer"
                ? "text-surface-foreground-soft"
                : "text-red-600 dark:text-red-400"
          }`}
        >
          {signedAmount(expense) >= 0 ? "+" : "-"}
          {formatCurrency(expense.amount, currency)}
        </p>
      </button>
      {/* Hidden whenever the row is swiped open (or mid-drag) — the swipe
       * panel and this hover cluster both anchor to the same right edge,
       * so showing both at once (e.g. a trackpad/touchscreen hybrid device
       * where a swiped-open row is also hovered) overlapped them into an
       * unreadable mess of stacked icons. */}
      {showHoverActions && liveX === 0 && (
        <div className="pointer-events-none absolute inset-y-0 right-2 hidden items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto sm:flex">
          {onEdit && (
            <button
              type="button"
              onClick={handleHoverEdit}
              aria-label={`Edit ${expense.merchant}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-surface-foreground-soft shadow-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              <EditIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleHoverShare}
            aria-label={`Share ${expense.merchant}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-surface-foreground-soft shadow-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <ShareIcon className="h-3.5 w-3.5" />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={handleHoverDelete}
              aria-label={`Delete ${expense.merchant}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-red-600 shadow-soft transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <DeleteIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
