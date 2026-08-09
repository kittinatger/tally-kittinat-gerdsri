export default function ProgressRingWidget({
  label,
  percent,
  centerValue,
  sublabel,
  ringClassName = "text-surface-accent",
}: {
  label: string;
  percent: number;
  centerValue: string;
  sublabel?: string;
  ringClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="7" stroke="var(--bg-soft)" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            stroke="currentColor"
            className={`transition-all ${ringClassName}`}
          />
        </svg>
        <div className="min-w-0">
          <p className="truncate font-display text-xl text-surface-foreground">{centerValue}</p>
          {sublabel && <p className="truncate text-xs text-surface-foreground-soft">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}
