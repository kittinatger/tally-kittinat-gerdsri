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
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="flex h-24 items-end gap-4">
        {[barA, barB].map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t ${bar.colorClassName}`}
                style={{ height: `${Math.max(4, (bar.value / max) * 100)}%` }}
              />
            </div>
            <p className="truncate text-[11px] font-semibold text-surface-foreground">{bar.displayValue}</p>
            <p className="truncate text-[10px] text-surface-foreground-soft">{bar.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
