"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import type { TrendPoint } from "../SpendingTrendChart";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import SegmentedControl from "../SegmentedControl";

export default function TrendSection({ expensePoints, incomePoints }: { expensePoints: TrendPoint[]; incomePoints: TrendPoint[] }) {
  const currency = useCurrency();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [chartType, setChartType] = useState<ChartType>("bar");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-foreground">Spending trend</h2>
          <p className="text-xs text-ink-soft">Income and expenses over the selected period.</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: "expense", label: "Expenses" },
              { value: "income", label: "Income" },
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
