"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import type { ProjectedSpend, UpcomingRecurringItem } from "@/lib/analytics";
import WidgetCard from "../WidgetCard";

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  );
}

export default function ForwardLookingSection({
  projected,
  upcoming,
}: {
  projected: ProjectedSpend;
  upcoming: UpcomingRecurringItem[];
}) {
  const currency = useCurrency();
  const pace = projected.spent > 0 ? Math.round((projected.projected / projected.spent) * 100) - 100 : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-foreground">Forward-looking</h2>
          <p className="text-xs text-ink-soft">Where this month is headed, and what&apos;s coming up.</p>
        </div>
        <Link href="/settings?panel=recurring" className="shrink-0 text-xs font-semibold text-navy hover:underline dark:text-blue-300">
          Manage recurring
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <WidgetCard color="amber" blob="top-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700/80 dark:text-amber-300/80">Projected month-end spend</p>
          <p className="mt-2 font-display text-2xl text-surface-foreground">{formatCurrency(projected.projected, currency)}</p>
          <p className="mt-1 text-xs text-surface-foreground-soft">
            {formatCurrency(projected.spent, currency)} spent so far ({projected.daysElapsed} of {projected.daysInMonth} days)
            {pace !== 0 && (
              <span className={pace > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                {" "}
                · {pace > 0 ? "+" : ""}
                {pace}% pace
              </span>
            )}
          </p>
        </WidgetCard>

        <WidgetCard color="teal" blob="bottom-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700/80 dark:text-teal-300/80">Upcoming recurring</p>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-surface-foreground-soft">Nothing scheduled — add a recurring rule in Settings.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcoming.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    <ClockIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-foreground">{item.merchant}</p>
                    <p className="text-[11px] text-surface-foreground-soft">
                      {item.daysUntil <= 0 ? "Due today" : item.daysUntil === 1 ? "Due tomorrow" : `In ${item.daysUntil} days`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-surface-foreground">{formatCurrency(item.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>
      </div>
    </div>
  );
}
