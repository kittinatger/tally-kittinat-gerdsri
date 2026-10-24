"use client";

import { useEffect, useRef, useState } from "react";
import { signedAmount, type Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { useCurrency } from "@/lib/currency-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, TrashIcon, EditIcon } from "@/lib/icons";
import { ExportIcon as PhExportIcon } from "@phosphor-icons/react/dist/ssr";

const OPEN_DELETE = -76;
const OPEN_SHARE = 76;
const MOVE_THRESHOLD = 6;
// A drag only counts as a swipe once it has gone this far and is clearly
// more sideways than up/down — otherwise it's treated as a scroll, so
// scrolling the list no longer nudges rows open by accident.
const SWIPE_SLOP = 12;
const SWIPE_AXIS_RATIO = 1.4;
// On release, a row snaps open only past this share of the action width,
// or with a quick flick (px per ms) in that direction.
const OPEN_FRACTION = 0.55;
const FLICK_VELOCITY = 0.45;
const LONG_PRESS_MS = 450;

function DeleteIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <TrashIcon className={className} />;
}

function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <PhExportIcon weight="fill" aria-hidden="true" className={className} />;
}

export async function shareExpense(expense: Expense, currency: string) {
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
  isOpen = false,
  onOpenChange,
  hideIcon = false,
  compact = false,
  hideTags = false,
  hideDate = false,
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
  /** Whether the list considers *this* row the one currently swiped open.
   * The list only ever tracks one open row id — see onOpenChange. */
  isOpen?: boolean;
  /** Reports this row's swipe-open state up to the list so it can close any
   * other row that was left open. Without this, each row kept fully
   * independent state: swiping row A open then swiping/tapping row B left
   * A's Share/Delete panel open too, so two different rows could show their
   * action panels at once — the "overlapping icons" bug. */
  onOpenChange?: (open: boolean) => void;
  /** From Settings > Activities' "Hide merchant icons" — omits the
   * circular category-icon badge entirely rather than just blanking it. */
  hideIcon?: boolean;
  /** From Settings > Activities' "Compact rows" — tighter padding and a
   * smaller icon. */
  compact?: boolean;
  /** From Settings > Activities' "Hide tag chips in list" — tags stay
   * visible in the expense detail view either way. */
  hideTags?: boolean;
  /** Leaves the date out of the subtitle — set when the list is grouped by
   * day, where the group heading already says it. */
  hideDate?: boolean;
}) {
  const color = useCategoryColor(expense.type, expense.category);
  const icon = useCategoryIcon(expense.type, expense.category);
  const currency = useCurrency();

  const [restX, setRestX] = useState(0);
  const [liveX, setLiveX] = useState(0);
  const [gestureStartX, setGestureStartX] = useState<number | null>(null);
  const [moved, setMoved] = useState(false);
  // Mouse users don't get the drag-to-swipe gesture — dragging with a mouse
  // is unreliable (accidental partial drags looked like the row was stuck
  // half-open) and isn't how desktop users expect a list row to behave.
  // Instead, click-and-hold reveals the same action cluster used for hover.
  const [heldOpen, setHeldOpen] = useState(false);
  const isMouseRef = useRef(false);
  // Per-gesture tracking that never needs a re-render: where the press
  // started vertically, which axis the gesture locked to, and the last
  // sample for flick velocity.
  const startYRef = useRef(0);
  const axisRef = useRef<"x" | "y" | null>(null);
  const lastSampleRef = useRef({ x: 0, t: 0, v: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const swipeEnabled = Boolean(onDelete) && !selectMode;
  // Swipe (touch) and hover/hold (mouse) both reach the same actions, so a
  // touchscreen-and-mouse hybrid device gets both discoverable paths.
  const showHoverActions = !selectMode && Boolean(onDelete || onEdit);

  // The list can tell this row to close (another row was opened instead)
  // without us ever needing to touch that other row's state directly.
  if (!isOpen && (restX !== 0 || heldOpen)) {
    setRestX(0);
    setLiveX(0);
    setHeldOpen(false);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  useEffect(() => clearLongPress, []);

  // Close the held-open cluster on an outside click — it has no drag gesture
  // to close it the way swipe does, so it needs its own dismiss path.
  useEffect(() => {
    if (!heldOpen) return;
    function handleOutside(e: PointerEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setHeldOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldOpen]);

  function closeSwipe() {
    setRestX(0);
    setLiveX(0);
    setHeldOpen(false);
    onOpenChange?.(false);
  }

  function handlePointerDown(e: React.PointerEvent) {
    isMouseRef.current = e.pointerType === "mouse";
    setGestureStartX(e.clientX);
    setMoved(false);
    startYRef.current = e.clientY;
    axisRef.current = null;
    lastSampleRef.current = { x: e.clientX, t: e.timeStamp, v: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (isMouseRef.current && showHoverActions && !heldOpen) {
      clearLongPress();
      longPressTimer.current = setTimeout(() => {
        setHeldOpen(true);
        setMoved(true); // consumed by the hold — pointerup shouldn't also fire onClick
        onOpenChange?.(true);
      }, LONG_PRESS_MS);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (gestureStartX === null) return;
    const delta = e.clientX - gestureStartX;
    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(delta) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD) {
      setMoved(true);
      clearLongPress();
    }
    if (!swipeEnabled || isMouseRef.current) return;
    if (axisRef.current === null) {
      if (Math.max(Math.abs(delta), Math.abs(deltaY)) < SWIPE_SLOP) return;
      axisRef.current = Math.abs(delta) > Math.abs(deltaY) * SWIPE_AXIS_RATIO ? "x" : "y";
    }
    if (axisRef.current !== "x") return;
    const last = lastSampleRef.current;
    const dt = e.timeStamp - last.t;
    if (dt > 0) lastSampleRef.current = { x: e.clientX, t: e.timeStamp, v: (e.clientX - last.x) / dt };
    // Measured from where the swipe actually began (past the slop), with a
    // little resistance beyond the fully-open position instead of a hard stop.
    const effective = delta - Math.sign(delta) * SWIPE_SLOP;
    const raw = restX + effective;
    const resist = (limit: number) => limit + (raw - limit) * 0.25;
    setLiveX(raw < OPEN_DELETE ? Math.max(OPEN_DELETE - 24, resist(OPEN_DELETE)) : raw > OPEN_SHARE ? Math.min(OPEN_SHARE + 24, resist(OPEN_SHARE)) : raw);
  }

  function handlePointerUp() {
    clearLongPress();
    if (gestureStartX === null) return;
    if (!moved) {
      if (heldOpen) {
        setHeldOpen(false);
        onOpenChange?.(false);
      } else if (restX !== 0) {
        closeSwipe();
      } else if (selectMode) {
        onToggleSelect?.();
      } else {
        onClick();
      }
    } else if (swipeEnabled && !isMouseRef.current) {
      if (axisRef.current !== "x") {
        // A scroll, not a swipe: leave the row exactly as it was.
        setLiveX(restX);
      } else {
        const v = lastSampleRef.current.v;
        let next = 0;
        if (restX === 0) {
          if (liveX <= OPEN_DELETE * OPEN_FRACTION || (liveX < 0 && v < -FLICK_VELOCITY)) next = OPEN_DELETE;
          else if (liveX >= OPEN_SHARE * OPEN_FRACTION || (liveX > 0 && v > FLICK_VELOCITY)) next = OPEN_SHARE;
        } else {
          // Already open: stays open unless dragged back a fair way or flicked shut.
          const closing = restX < 0 ? liveX > restX * OPEN_FRACTION || v > FLICK_VELOCITY : liveX < restX * OPEN_FRACTION || v < -FLICK_VELOCITY;
          next = closing ? 0 : restX;
        }
        setRestX(next);
        setLiveX(next);
        onOpenChange?.(next !== 0);
      }
    }
    axisRef.current = null;
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
    <div ref={rowRef} data-swiped={liveX !== 0 || restX !== 0} className={`group relative overflow-hidden ${isLast ? "" : "border-b border-surface-line"}`}>
      {swipeEnabled && (
        <div data-swipe-backdrop className="absolute inset-y-0 left-0 right-0 flex items-stretch justify-between">
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
      {/*
       * The swipe backdrop above is always rendered, just normally hidden
       * behind an opaque background. But the row's hover tint
       * (--surface-nav-hover) is deliberately translucent (~12-16% alpha,
       * see globals.css) — every other hover surface in the app wants that
       * subtlety, but applied directly to the element responsible for
       * hiding the backdrop, hovering let the backdrop's saturated
       * Share/Delete colors bleed straight through on both edges. This
       * inner solid div is a dedicated opaque occluder underneath the
       * button: the translucent hover tint blends onto *it*, never onto
       * the backdrop.
       */}
      <div
        style={{ transform: `translateX(${liveX}px)` }}
        className={`relative w-full ${gestureStartX === null ? "transition-transform" : ""}`}
      >
        <div className="absolute inset-0 bg-surface" aria-hidden="true" />
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: swipeEnabled ? "pan-y" : undefined }}
          className={`relative flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-[var(--surface-nav-hover)] ${
            compact ? "px-3 py-2" : "px-4 py-3.5"
          } ${selected ? "bg-[var(--surface-nav-hover)]" : ""}`}
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
          {!hideIcon && (
            <span
              data-row-badge
              className={`flex shrink-0 items-center justify-center rounded-full ${compact ? "h-9 w-9" : "h-11 w-11"} ${badgeClasses(color)}`}
            >
              {icon && isCategoryIconKey(icon) ? (
                <CategoryIcon iconKey={icon} className={compact ? "h-4 w-4" : "h-5 w-5"} />
              ) : (
                <span className={compact ? "text-base" : "text-lg"}>{expense.category.charAt(0).toUpperCase()}</span>
              )}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-surface-foreground">{expense.merchant}</p>
            <p className="mt-0.5 truncate text-xs text-surface-foreground-soft">
              {expense.category}
              {!hideDate && <> · {formatDateLong(expense.date)}</>}
            </p>
            {!hideTags && expense.tags.length > 0 && (
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
            data-amount
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
      {/* Hidden whenever the row is swiped open (or mid-drag) — the swipe
       * panel and this hover cluster both anchor to the same right edge,
       * so showing both at once (e.g. a trackpad/touchscreen hybrid device
       * where a swiped-open row is also hovered) overlapped them into an
       * unreadable mess of stacked icons. Forced visible via `heldOpen`
       * when a mouse user click-and-holds instead of hovering.
       *
       * No permanent pr-* reservation on the row for this anymore — that
       * left a dead gap between the amount and the card's edge even while
       * not hovered (the whole point was space that only exists when the
       * icons actually show). Instead this floats on top of the amount, a
       * soft leftward fade (matching the row's own background) easing it
       * out of the way instead of a hard edge. */}
      {showHoverActions && liveX === 0 && (
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 hidden items-center gap-1 py-1 pl-12 pr-3 opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto sm:flex ${
            heldOpen ? "!opacity-100 !pointer-events-auto" : ""
          }`}
          style={{ background: "linear-gradient(to left, var(--surface) 60%, transparent)" }}
        >
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
