import WidgetCard from "./WidgetCard";

export type DonutSegment = { label: string; value: number; colorClassName: string; displayValue: string };

export default function DonutChartWidget({ title, segments }: { title: string; segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.reduce<{ segment: DonutSegment; dash: number; offset: number }[]>((acc, segment) => {
    const prev = acc[acc.length - 1];
    const cursor = prev ? prev.offset + prev.dash : 0;
    const gap = segments.length > 1 ? circumference * 0.008 : 0;
    const dash = Math.max(0, circumference * (segment.value / total) - gap);
    acc.push({ segment, dash, offset: cursor });
    return acc;
  }, []);
  const topShare = total > 0 ? Math.round((segments[0]?.value ?? 0) / total * 100) : 0;

  return (
    <WidgetCard color="slate">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      {total <= 0 ? (
        <p className="mt-2 text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="mt-2 flex flex-1 flex-col items-center">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-28 w-28 -rotate-90">
              <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="8" stroke="var(--bg-soft)" />
              {arcs.map(({ segment: s, dash, offset }) => (
                <circle
                  key={s.label}
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  className={s.colorClassName}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="font-display text-xl text-surface-foreground">{topShare}%</p>
              <p className="truncate px-3 text-[10px] text-surface-foreground-soft">{segments[0]?.label}</p>
            </div>
          </div>
          <div className="mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
            {segments.slice(0, 4).map((s) => (
              <div key={s.label} className="flex min-w-0 items-center justify-between gap-1.5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full bg-current ${s.colorClassName}`} />
                  <span className="truncate text-surface-foreground-soft">{s.label}</span>
                </span>
                <span className="shrink-0 font-medium text-surface-foreground">{s.displayValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
