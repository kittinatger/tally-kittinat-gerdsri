"use client";

import { useT } from "@/lib/language-context";
import type { PeriodOverview, SavingsRate } from "@/lib/analytics";
import WidgetCard from "../WidgetCard";
import SectionHeader from "./SectionHeader";

function PiggyBankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5.5 8A4 4 0 0 1 13.4 6.4 3.25 3.25 0 0 1 16.5 9.5 3 3 0 0 1 13.5 12.5H6a3.5 3.5 0 0 1-.5-6.96Z" />
      <path d="M10 9.5v5.5M7.8 12.6l2.2 2.4 2.2-2.4" />
    </svg>
  );
}

// Derived straight from the Overview section's own income/expense totals
// (see computeSavingsRate in lib/analytics.ts) — "what fraction of what
// came in actually stayed" is a different, complementary question from
// the raw income/expense/net numbers Overview already shows.
export default function SavingsRateSection({ overview, savings }: { overview: PeriodOverview; savings: SavingsRate }) {
  const t = useT();
  const delta = savings.rate - savings.ratePrev;
  const hasIncome = overview.income > 0;
  const spentPct = hasIncome ? Math.min(100, Math.max(0, (overview.expense / overview.income) * 100)) : 100;
  const color = !hasIncome ? "slate" : savings.rate >= 0 ? "emerald" : "rose";

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader icon={<PiggyBankIcon className="h-4 w-4" />} title={t("analytics.sectionSavings")} description={t("analytics.savingsDesc")} />

      <WidgetCard color={color} blob="top-right">
        {hasIncome ? (
          <>
            <p className={`font-display text-3xl ${savings.rate >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
              {savings.rate >= 0 ? "" : "−"}
              {Math.abs(Math.round(savings.rate))}%
            </p>
            <p className="mt-1 text-sm text-surface-foreground-soft">{t("analytics.savingsOfIncome")}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-soft">
              <div className="h-full rounded-full bg-navy transition-all duration-500 ease-out" style={{ width: `${spentPct}%` }} />
            </div>
            {savings.ratePrev !== 0 && (
              <p className="mt-2 text-xs text-surface-foreground-soft">
                {delta !== 0 && (
                  <span className={delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                    {delta > 0 ? "+" : ""}
                    {Math.round(delta)} {t("analytics.pointsVsPrevious")}
                  </span>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-surface-foreground-soft">{t("analytics.noIncomeThisPeriod")}</p>
        )}
      </WidgetCard>
    </div>
  );
}
