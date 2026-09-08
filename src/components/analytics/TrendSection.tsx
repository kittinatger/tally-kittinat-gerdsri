"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import type { TrendPoint } from "../SpendingTrendChart";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import SegmentedControl from "../SegmentedControl";

export default function TrendSection({ expensePoints, incomePoints }: { expensePoints: TrendPoint[]; incomePoints: TrendPoint[] }) {
  const currency = useCurrency();
  const t = useT();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [chartType, setChartType] = useState<ChartType>("bar");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-foreground">{t("analytics.sectionTrend")}</h2>
          <p className="text-xs text-ink-soft">{t("analytics.trendDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: "expense", label: t("common.expense") },
              { value: "income", label: t("common.income") },
            ]}
          />
          <ChartTypeDropdown value={chartType} onChange={setChartType} />
        </div>
      </div>
      <div className="rounded-card border border-line bg-surface p-4">
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
