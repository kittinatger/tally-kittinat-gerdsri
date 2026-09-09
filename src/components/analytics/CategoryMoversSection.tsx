"use client";

import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import { badgeClasses } from "@/lib/category-styles";
import type { CategoryOption } from "@/types/category";
import type { CategoryMover } from "@/lib/analytics";
import SectionHeader from "./SectionHeader";

function TrendUpDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h5.5l-2 2M8.5 6 6.5 4" />
      <path d="M17 14h-5.5l2-2M11.5 14l2 2" />
    </svg>
  );
}

// Which expense categories moved the most vs the previous period, up or
// down (see categoryMovers in lib/analytics.ts) — complements
// CategoryOverview's current-period-only breakdown with a "what changed"
// view.
export default function CategoryMoversSection({ movers, categories }: { movers: CategoryMover[]; categories: CategoryOption[] }) {
  const currency = useCurrency();
  const t = useT();

  function colorFor(name: string): string | undefined {
    return categories.find((c) => c.name === name && c.type === "expense")?.color;
  }

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader icon={<TrendUpDownIcon className="h-4 w-4" />} title={t("analytics.sectionMovers")} description={t("analytics.moversDesc")} />

      {movers.length === 0 ? (
        <div className="rounded-card border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm text-ink-soft">{t("analytics.noMerchantsYet")}</p>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-2">
          {movers.map((m, i) => {
            const up = m.delta > 0;
            return (
              <div
                key={m.category}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 animate-[fade-in-up_0.35s_ease-out_backwards] motion-reduce:animate-none"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    up ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {up ? "↑" : "↓"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(colorFor(m.category))}`}>{m.category}</span>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {formatCurrency(m.previous, currency)} → {formatCurrency(m.current, currency)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${up ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {up ? "+" : "−"}
                    {formatCurrency(Math.abs(m.delta), currency)}
                  </p>
                  {m.deltaPct !== null && (
                    <p className="text-[11px] text-ink-soft">
                      {up ? "+" : ""}
                      {Math.round(m.deltaPct)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
