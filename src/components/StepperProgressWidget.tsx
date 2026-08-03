export default function StepperProgressWidget({
  title,
  subtitle,
  stages,
  activeIndex,
  progressPercent,
  accentClassName = "bg-surface-accent",
}: {
  title: string;
  subtitle: string;
  stages: string[];
  activeIndex: number;
  progressPercent: number;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-surface-foreground">{title}</p>
        <p className="text-xs text-surface-foreground-soft">{subtitle}</p>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
        <div className={`h-full rounded-full transition-all ${accentClassName}`} style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
      </div>
      <div className="mt-2.5 flex justify-between">
        {stages.map((stage, i) => (
          <div key={stage} className="flex flex-col items-center gap-1" style={{ width: `${100 / stages.length}%` }}>
            <span
              className={`h-2 w-2 rounded-full ${i <= activeIndex ? accentClassName : "bg-bg-soft"}`}
            />
            <span
              className={`truncate text-[10px] font-medium ${
                i === activeIndex ? "text-surface-foreground" : "text-surface-foreground-soft"
              }`}
            >
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
