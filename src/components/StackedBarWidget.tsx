export type StackedSegment = { label: string; value: number; colorClassName: string; displayValue: string };

export default function StackedBarWidget({ title, segments }: { title: string; segments: StackedSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      {total <= 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <>
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-bg-soft">
            {segments.map((s) => (
              <div
                key={s.label}
                className={s.colorClassName}
                style={{ width: `${Math.max(0, (s.value / total) * 100)}%` }}
                title={`${s.label}: ${s.displayValue}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {segments.slice(0, 6).map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.colorClassName}`} />
                <span className="text-surface-foreground-soft">
                  {s.label} <span className="text-surface-foreground">{s.displayValue}</span>
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
