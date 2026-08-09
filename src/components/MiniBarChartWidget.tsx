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
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="flex h-20 items-end gap-1">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t ${barClassName}`}
                style={{ height: `${Math.max(3, (b.value / max) * 100)}%` }}
                title={b.label}
              />
            </div>
            {bars.length <= 7 && (
              <span className="text-[9px] text-surface-foreground-soft">{b.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
