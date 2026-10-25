"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowsClockwiseIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { formatCurrency, todayInputValue } from "@/lib/format";
import { badgeClasses } from "@/lib/category-styles";
import { useCategoryColor, useCategoryIcon } from "@/lib/categories-context";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon } from "@/lib/icons";
import type { TransactionType } from "@/lib/categories";

export type UpcomingItem = { id: number; merchant: string; amount: number; type: TransactionType; category: string; nextRunDate: string };

const COLLAPSED_ROWS = 3;

// "Today", "Tomorrow", a weekday within the week, otherwise a short date.
function whenLabel(date: string): string {
  const today = new Date(`${todayInputValue()}T00:00:00`);
  const d = new Date(`${date}T00:00:00`);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Recurring transactions due in the next 7 days, on Activities (sidebar on
// iPad/desktop, above the list on phones). Hidden when nothing is due.
export default function UpcomingRecurring({ items, currency, collapsible = false }: { items: UpcomingItem[]; currency: string; collapsible?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = collapsible && !expanded ? items.slice(0, COLLAPSED_ROWS) : items;

  return (
    <section className="overflow-hidden rounded-card border border-surface-line bg-surface">
      <Link
        href="/settings?panel=recurring"
        className="flex items-center gap-2 border-b border-surface-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft transition hover:text-surface-foreground"
      >
        <ArrowsClockwiseIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
        <span className="flex-1">Coming up · next 7 days</span>
        <CaretRightIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
      <ul className="divide-y divide-surface-line">
        {shown.map((item) => (
          <UpcomingRow key={item.id} item={item} currency={currency} />
        ))}
      </ul>
      {collapsible && items.length > COLLAPSED_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-surface-line px-4 py-2.5 text-xs font-semibold text-surface-accent transition hover:bg-[var(--surface-nav-hover)]"
        >
          {expanded ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </section>
  );
}

function UpcomingRow({ item, currency }: { item: UpcomingItem; currency: string }) {
  const color = useCategoryColor(item.type, item.category);
  const icon = useCategoryIcon(item.type, item.category);
  const amountClass =
    item.type === "income" ? "text-emerald-600 dark:text-emerald-400" : item.type === "transfer" ? "text-surface-foreground-soft" : "text-red-600 dark:text-red-400";
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeClasses(color)}`}>
        {icon && isCategoryIconKey(icon) ? (
          <CategoryIcon iconKey={icon} className="h-4 w-4" />
        ) : (
          <span className="text-xs font-semibold">{item.category.charAt(0).toUpperCase()}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-surface-foreground">{item.merchant}</span>
        <span className="block text-xs text-surface-foreground-soft">{whenLabel(item.nextRunDate)}</span>
      </span>
      <span className={`shrink-0 text-sm font-semibold tabular-nums ${amountClass}`}>
        {item.type === "income" ? "+" : "−"}
        {formatCurrency(item.amount, currency)}
      </span>
    </li>
  );
}
