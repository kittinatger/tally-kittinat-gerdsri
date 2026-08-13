import WidgetCard from "./WidgetCard";

export default function ComparisonBarsWidget({
  title,
  barA,
  barB,
}: {
  title: string;
  barA: { label: string; value: number; displayValue: string; colorClassName: string };
  barB: { label: string; value: number; displayValue: string; colorClassName: string };
}) {
  const max = Math.max(barA.value, barB.value, 1);

  return (
    <WidgetCard color="slate">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="flex flex-1 items-end gap-5">
        {[barA, barB].map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
            <p className="text-sm font-semibold text-surface-foreground">{bar.displayValue}</p>
            <div className="flex h-20 w-full items-end overflow-hidden rounded-xl bg-bg-soft">
              <div
                className={`w-full rounded-t-xl transition-all ${bar.colorClassName}`}
                style={{ height: `${Math.max(6, (bar.value / max) * 100)}%` }}
              />
            </div>
            <p className="truncate text-[11px] font-medium text-surface-foreground-soft">{bar.label}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
