"use client";

import { useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";

const OPEN_DELETE = -76;
const OPEN_SHARE = 76;
const MOVE_THRESHOLD = 6;

function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9.4a1.5 1.5 0 0 1-1.5 1.6H8.1a1.5 1.5 0 0 1-1.5-1.6L6 6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M13 6.5a2 2 0 1 0-1.94-2.5L7.1 6.4a2 2 0 1 0 0 3.2l3.96 2.4a2 2 0 1 0 .6-1.7L7.7 8a2 2 0 0 0 0-.5l3.96-2.4c.2.15.4.27.63.36" />
      <circle cx="13" cy="4.5" r="2" />
      <circle cx="5" cy="8" r="2" />
      <circle cx="13" cy="15.5" r="2" />
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
  isLast,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  expense: Expense;
  onClick: () => void;
  /** Enables swipe-left-to-delete when provided (Activities list only). */
  onDelete?: (id: number) => void;
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

  return (
    <div className={`relative overflow-hidden ${isLast ? "" : "border-b border-surface-line"}`}>
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
        } hover:bg-[var(--surface-nav-hover)] ${selected ? "bg-[var(--surface-nav-hover)]" : ""}`}
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
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-surface-foreground">{expense.merchant}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(color)}`}>
              {icon ? `${icon} ` : ""}
              {expense.category}
            </span>
            <span className="text-xs text-surface-foreground-soft">{formatDateLong(expense.date)}</span>
          </div>
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
    </div>
  );
}
