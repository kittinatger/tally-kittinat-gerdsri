import WidgetCard from "./WidgetCard";

export type MiniBar = { label: string; value: number };

export default function MiniBarChartWidget({
  title,
  bars,
  barClassName = "bg-surface-accent",
}: {
  title: string;
  bars: MiniBar[];
  barClassName?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <WidgetCard color="slate">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="flex h-20 flex-1 items-end gap-1.5">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-bg-soft">
              <div
                className={`w-full rounded-md transition-all ${barClassName}`}
                style={{ height: `${Math.max(4, (b.value / max) * 100)}%` }}
                title={b.label}
              />
            </div>
            {bars.length <= 7 && <span className="text-[9px] font-medium text-surface-foreground-soft">{b.label}</span>}
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
