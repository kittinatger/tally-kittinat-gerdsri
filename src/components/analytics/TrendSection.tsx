"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/language-context";
import type { TrendPoint } from "../SpendingTrendChart";
import SpendingTrendChart, { ChartTypeDropdown, type ChartType } from "../SpendingTrendChart";
import SegmentedControl from "../SegmentedControl";
import SectionHeader from "./SectionHeader";
import { TrendUpIcon as PhTrendUpIcon } from "@phosphor-icons/react/dist/ssr";

function TrendIcon({ className }: { className?: string }) {
  return <PhTrendUpIcon weight="fill" aria-hidden="true" className={className} />;
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
