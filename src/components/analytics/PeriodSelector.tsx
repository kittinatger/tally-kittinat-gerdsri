"use client";

import SelectDropdown from "../SelectDropdown";
import { ANALYTICS_PERIODS, type AnalyticsPeriodId } from "@/lib/analytics";

const PERIOD_LABELS: Record<AnalyticsPeriodId, string> = {
  thisMonth: "This month",
  lastMonth: "Last month",
  last3Months: "Last 3 months",
  last6Months: "Last 6 months",
  yearToDate: "Year to date",
};

export default function PeriodSelector({ value, onChange }: { value: AnalyticsPeriodId; onChange: (id: AnalyticsPeriodId) => void }) {
  return (
    <SelectDropdown
      value={PERIOD_LABELS[value]}
      options={ANALYTICS_PERIODS.map((id) => PERIOD_LABELS[id])}
      onChange={(label) => {
        const id = ANALYTICS_PERIODS.find((p) => PERIOD_LABELS[p] === label);
        if (id) onChange(id);
      }}
    />
  );
}
