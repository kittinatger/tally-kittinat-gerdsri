"use client";

import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import type { WeekdaySpend } from "@/lib/analytics";
import SectionHeader from "./SectionHeader";

function CalendarBarsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14" />
      <path d="M6.5 11v3M10 10v4M13.5 12v2" />
    </svg>
  );
}

// Locale-aware weekday labels via Intl rather than a per-language i18n key
// per day name — a fixed reference Sunday (2023-01-01) walked forward by
// `weekday` days, formatted with the viewer's own locale/calendar.
function weekdayLabel(weekday: number, short = true): string {
  const d = new Date(2023, 0, 1 + weekday); // 2023-01-01 was a Sunday
  return d.toLocaleDateString(undefined, { weekday: short ? "short" : "long" });
}

// Which day of the week you tend to spend the most on, within the period
// already selected elsewhere on the page (see spendingByWeekday in
// lib/analytics.ts).
export default function WeekdaySpendingSection({ weekdays }: { weekdays: WeekdaySpend[] }) {
  const currency = useCurrency();
  const t = useT();
  const maxAmount = Math.max(...weekdays.map((w) => w.amount), 0);
  const total = weekdays.reduce((s, w) => s + w.amount, 0);
  const topDay = total > 0 ? weekdays.reduce((best, w) => (w.amount > best.amount ? w : best), weekdays[0]) : null;

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<CalendarBarsIcon className="h-4 w-4" />}
        title={t("analytics.sectionWeekday")}
        description={
          topDay
            ? t("analytics.weekdayDescWithTop").replace("{day}", weekdayLabel(topDay.weekday, false))
            : t("analytics.weekdayDesc")
        }
      />

      {total === 0 ? (
        <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm text-ink-soft">{t("analytics.noMerchantsYet")}</p>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-4">
          <div className="flex items-end justify-between gap-2">
            {weekdays.map((w, i) => {
              const heightPct = maxAmount > 0 ? Math.max((w.amount / maxAmount) * 100, w.amount > 0 ? 6 : 2) : 2;
              const isTop = topDay && w.weekday === topDay.weekday && w.amount > 0;
              return (
                <div key={w.weekday} className="flex flex-1 flex-col items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-surface-foreground">{w.amount > 0 ? formatCurrency(w.amount, currency) : ""}</p>
                  <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-bg-soft">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ease-out animate-[fade-in-up_0.4s_ease-out_backwards] motion-reduce:animate-none ${
                        isTop ? "bg-navy" : "bg-navy/40"
                      }`}
                      style={{ height: `${heightPct}%`, animationDelay: `${i * 50}ms` }}
                    />
                  </div>
                  <p className={`text-xs font-semibold ${isTop ? "text-navy" : "text-ink-soft"}`}>{weekdayLabel(w.weekday)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
