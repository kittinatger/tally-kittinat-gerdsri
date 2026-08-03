export type DonutSegment = { label: string; value: number; colorClassName: string; displayValue: string };

export default function DonutChartWidget({ title, segments }: { title: string; segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.reduce<{ segment: DonutSegment; dash: number; offset: number }[]>((acc, segment) => {
    const prev = acc[acc.length - 1];
    const cursor = prev ? prev.offset + prev.dash : 0;
    const dash = circumference * (segment.value / total);
    acc.push({ segment, dash, offset: cursor });
    return acc;
  }, []);

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      {total <= 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="9" stroke="var(--bg-soft)" />
            {arcs.map(({ segment: s, dash, offset }) => (
              <circle
                key={s.label}
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                strokeWidth="9"
                stroke="currentColor"
                className={s.colorClassName}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            ))}
          </svg>
          <div className="min-w-0 flex-1 space-y-1">
            {segments.slice(0, 4).map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full bg-current ${s.colorClassName}`} />
                  <span className="truncate text-surface-foreground">{s.label}</span>
                </span>
                <span className="shrink-0 text-surface-foreground-soft">{s.displayValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
