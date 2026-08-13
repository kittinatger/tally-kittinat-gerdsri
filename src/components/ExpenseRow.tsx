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
    <svg viewBox="0 0 25.6738 31.2305" fill="currentColor" className="h-5 w-5">
      <path d="M8.76953 24.8389C8.19824 24.8389 7.8125 24.4727 7.7832 23.9014L7.39258 10.3271C7.37305 9.74609 7.75391 9.37988 8.34961 9.37988C8.9209 9.37988 9.31641 9.74121 9.33594 10.3174L9.74121 23.8867C9.76074 24.458 9.375 24.8389 8.76953 24.8389ZM12.6611 24.8389C12.0752 24.8389 11.6797 24.4678 11.6797 23.9014L11.6797 10.3125C11.6797 9.74609 12.0752 9.37988 12.6611 9.37988C13.2422 9.37988 13.6377 9.74609 13.6377 10.3125L13.6377 23.9014C13.6377 24.4678 13.2422 24.8389 12.6611 24.8389ZM16.543 24.8389C15.9375 24.8389 15.5566 24.458 15.5762 23.8916L15.9766 10.3223C15.9961 9.74609 16.3916 9.37988 16.9678 9.37988C17.5635 9.37988 17.9395 9.75098 17.9248 10.332L17.5293 23.9014C17.5 24.4775 17.1143 24.8389 16.543 24.8389ZM6.73828 5.78125L9.34082 5.78125L9.34082 3.2666C9.34082 2.6709 9.75586 2.29004 10.4199 2.29004L14.8779 2.29004C15.542 2.29004 15.957 2.6709 15.957 3.2666L15.957 5.78125L18.5596 5.78125L18.5596 3.17383C18.5596 1.15723 17.2949 0 15.0635 0L10.2344 0C8.00781 0 6.73828 1.15723 6.73828 3.17383ZM1.26953 7.53418L24.043 7.53418C24.7656 7.53418 25.3125 7.00195 25.3125 6.28418C25.3125 5.57129 24.7656 5.04395 24.043 5.04395L1.26953 5.04395C0.556641 5.04395 0 5.57617 0 6.28418C0 7.00684 0.556641 7.53418 1.26953 7.53418ZM6.87012 28.8232L18.457 28.8232C20.4883 28.8232 21.7822 27.6416 21.8799 25.6006L22.7441 7.27539L2.57324 7.27539L3.4375 25.6055C3.53516 27.6514 4.81445 28.8232 6.87012 28.8232Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 23.5205 35.4297" fill="currentColor" className="h-5 w-5">
      <path d="M23.1592 16.0986L23.1592 25.8057C23.1592 29.3604 21.1768 31.3477 17.6172 31.3477L5.54199 31.3477C1.98242 31.3477 0 29.3604 0 25.8057L0 16.0986C0 12.5488 1.98242 10.5615 5.54199 10.5615L7.93945 10.5615L7.93945 13.4521L5.67871 13.4521C3.8916 13.4521 2.89062 14.4629 2.89062 16.2451L2.89062 25.6641C2.89062 27.4512 3.8916 28.457 5.67871 28.457L17.4756 28.457C19.2676 28.457 20.2734 27.4512 20.2734 25.6641L20.2734 16.2451C20.2734 14.4629 19.2676 13.4521 17.4756 13.4521L15.2197 13.4521L15.2197 10.5615L17.6172 10.5615C21.1768 10.5615 23.1592 12.5488 23.1592 16.0986Z" />
      <path d="M7.1875 8.38379C7.50977 8.38379 7.83203 8.24707 8.05176 8.00781L9.74609 6.2207L11.582 3.72559L13.4131 6.2207L15.1025 8.00781C15.3223 8.24707 15.6348 8.38379 15.957 8.38379C16.5674 8.38379 17.1045 7.92969 17.1045 7.28027C17.1045 6.95312 16.9775 6.70898 16.748 6.47461L12.6074 2.48535C12.2656 2.14844 11.9287 2.03125 11.582 2.03125C11.2305 2.03125 10.8936 2.14844 10.5518 2.48535L6.41113 6.47461C6.18164 6.70898 6.05469 6.95312 6.05469 7.28027C6.05469 7.92969 6.58203 8.38379 7.1875 8.38379ZM11.582 20.8984C12.3047 20.8984 12.8906 20.3027 12.8906 19.6143L12.8906 7.17773L12.6318 3.38867C12.5879 2.8125 12.1582 2.33887 11.582 2.33887C11.001 2.33887 10.5713 2.8125 10.5273 3.38867L10.2686 7.17773L10.2686 19.6143C10.2686 20.3027 10.8545 20.8984 11.582 20.8984Z" />
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
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${badgeClasses(color)}`}
        >
          {icon || expense.category.charAt(0).toUpperCase()}
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
    </div>
  );
}
