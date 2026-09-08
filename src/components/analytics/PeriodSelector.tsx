"use client";

import SelectDropdown from "../SelectDropdown";
import { ANALYTICS_PERIODS, type AnalyticsPeriodId } from "@/lib/analytics";
import { useT } from "@/lib/language-context";

export default function PeriodSelector({ value, onChange }: { value: AnalyticsPeriodId; onChange: (id: AnalyticsPeriodId) => void }) {
  const t = useT();
  const periodLabels: Record<AnalyticsPeriodId, string> = {
    thisMonth: t("analytics.periodThisMonth"),
    lastMonth: t("analytics.periodLastMonth"),
    last3Months: t("analytics.periodLast3Months"),
    last6Months: t("analytics.periodLast6Months"),
    yearToDate: t("analytics.periodYearToDate"),
  };
  return (
    <SelectDropdown
      value={periodLabels[value]}
      options={ANALYTICS_PERIODS.map((id) => periodLabels[id])}
      onChange={(label) => {
        const id = ANALYTICS_PERIODS.find((p) => periodLabels[p] === label);
        if (id) onChange(id);
      }}
    />
  );
}
