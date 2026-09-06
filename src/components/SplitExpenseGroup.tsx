"use client";

import { useState } from "react";
import type { Expense } from "@/types/expense";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { badgeClasses } from "@/lib/category-styles";

function SplitIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 6h5.5M4 6l2.5-2.5M4 6l2.5 2.5" />
      <path d="M16 14h-5.5M16 14l-2.5-2.5M16 14l-2.5 2.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-surface-foreground-soft transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

export default function SplitExpenseGroup({
  items,
  onSelectLine,
  isLast,
  hideIcon = false,
  compact = false,
  collapsedByDefault = false,
}: {
  items: Expense[];
  onSelectLine: (expense: Expense) => void;
  isLast: boolean;
  /** From Settings > Activities' "Hide merchant icons" — omits the split
   * icon badge entirely rather than just blanking it. */
  hideIcon?: boolean;
  /** From Settings > Activities' "Compact rows" — tighter padding and a
   * smaller icon. */
  compact?: boolean;
  /** From Settings > Activities' "Collapse split groups by default" — the
   * per-category line-item breakdown starts hidden until tapped, instead
   * of always expanded. */
  collapsedByDefault?: boolean;
}) {
  const currency = useCurrency();
  const [expanded, setExpanded] = useState(!collapsedByDefault);
  const first = items[0];
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={`${compact ? "px-3 py-2" : "px-4 py-3.5"} ${isLast ? "" : "border-b border-surface-line"}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 text-left"
      >
        {!hideIcon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-full ${compact ? "h-9 w-9" : "h-11 w-11"} ${badgeClasses("amber")}`}
          >
            <SplitIcon />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-surface-foreground">{first.merchant}</p>
          <p className="mt-0.5 truncate text-xs text-surface-foreground-soft">
            Split · {items.length} categories · {formatDateLong(first.date)}
          </p>
        </div>
        <p
          className={`shrink-0 font-semibold ${
            first.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {first.type === "income" ? "+" : "-"}
          {formatCurrency(total, currency)}
        </p>
        <ChevronIcon open={expanded} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-0.5 border-l-2 border-amber-200 pl-3 dark:border-amber-900/50">
          {items.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectLine(e)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface-nav-hover)]"
            >
              <span className="truncate text-sm text-surface-foreground">{e.category}</span>
              <span className="shrink-0 text-sm text-surface-foreground-soft">{formatCurrency(e.amount, currency)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
