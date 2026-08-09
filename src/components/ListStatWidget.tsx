export type ListStatItem = { label: string; value: number; displayValue: string };

export default function ListStatWidget({
  title,
  items,
  barClassName = "bg-surface-accent",
}: {
  title: string;
  items: ListStatItem[];
  barClassName?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div key={it.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-surface-foreground">{it.label}</span>
                <span className="shrink-0 text-surface-foreground-soft">{it.displayValue}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                <div
                  className={`h-full rounded-full ${barClassName}`}
                  style={{ width: `${Math.max(4, (it.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
