"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import type { TrendPoint } from "../SpendingTrendChart";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import SegmentedControl from "../SegmentedControl";
import SectionHeader from "./SectionHeader";

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 16V9M8.5 16V4M14 16v-6M19.5 16v-3" />
    </svg>
  );
}

export default function TrendSection({ expensePoints, incomePoints }: { expensePoints: TrendPoint[]; incomePoints: TrendPoint[] }) {
  const currency = useCurrency();
  const t = useT();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [chartType, setChartType] = useState<ChartType>("bar");

  return (
    <div className="animate-[fade-in-up_0.4s_ease-out] motion-reduce:animate-none">
      <SectionHeader
        icon={<TrendIcon className="h-4 w-4" />}
        title={t("analytics.sectionTrend")}
        description={t("analytics.trendDesc")}
        action={
          <>
            <SegmentedControl
              value={kind}
              onChange={setKind}
              options={[
                { value: "expense", label: t("common.expense") },
                { value: "income", label: t("common.income") },
              ]}
            />
            <ChartTypeDropdown value={chartType} onChange={setChartType} />
          </>
        }
      />
      <div className="rounded-card border border-line bg-gradient-to-br from-bg-soft to-surface p-4">
        <SpendingTrendChart
          chartType={chartType}
          points={kind === "expense" ? expensePoints : incomePoints}
          stackedPoints={[]}
          currency={currency}
          seriesTextClass={kind === "income" ? "text-emerald-500 dark:text-emerald-400" : "text-navy dark:text-blue-300"}
          seriesBgClass={kind === "income" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-navy"}
        />
      </div>
    </div>
  );
}
