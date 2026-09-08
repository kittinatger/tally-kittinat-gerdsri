"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import type { ProjectedSpend, UpcomingRecurringItem } from "@/lib/analytics";
import WidgetCard from "../WidgetCard";
import SectionHeader from "./SectionHeader";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  );
}
function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="m12.3 7.7-1.4 3.6-3.6 1.4 1.4-3.6z" />
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
  const t = useT();
  const pace = projected.spent > 0 ? Math.round((projected.projected / projected.spent) * 100) - 100 : 0;
  const spentSoFar = t("analytics.spentSoFar")
    .replace("{amount}", formatCurrency(projected.spent, currency))
    .replace("{elapsed}", String(projected.daysElapsed))
    .replace("{total}", String(projected.daysInMonth));
  const paceText = t("analytics.pace").replace("{pct}", `${pace > 0 ? "+" : ""}${pace}`);
  const progressPct = projected.projected > 0 ? Math.min(100, (projected.spent / projected.projected) * 100) : 0;

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<CompassIcon className="h-4 w-4" />}
        title={t("analytics.sectionForward")}
        description={t("analytics.forwardDesc")}
        action={
          <Link href="/settings?panel=recurring" className="shrink-0 text-xs font-semibold text-navy hover:underline dark:text-blue-300">
            {t("analytics.manageRecurring")}
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <WidgetCard color="amber" blob="top-right" delayMs={0}>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700/80 dark:text-amber-300/80">{t("analytics.projectedSpend")}</p>
          <p className="mt-2 font-display text-2xl text-surface-foreground">{formatCurrency(projected.projected, currency)}</p>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-amber-900/10 dark:bg-amber-100/10">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-surface-foreground-soft">
            {spentSoFar}
            {pace !== 0 && (
              <span className={pace > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                {" "}
                · {paceText}
              </span>
            )}
          </p>
        </WidgetCard>

        <WidgetCard color="teal" blob="bottom-left" delayMs={80}>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700/80 dark:text-teal-300/80">{t("analytics.upcomingRecurring")}</p>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-surface-foreground-soft">{t("analytics.noRecurringScheduled")}</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcoming.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 animate-[fade-in-up_0.35s_ease-out_backwards] motion-reduce:animate-none"
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    <ClockIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-foreground">{item.merchant}</p>
                    <p className="text-[11px] text-surface-foreground-soft">
                      {item.daysUntil <= 0
                        ? t("analytics.dueToday")
                        : item.daysUntil === 1
                          ? t("analytics.dueTomorrow")
                          : t("analytics.dueInDays").replace("{days}", String(item.daysUntil))}
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
