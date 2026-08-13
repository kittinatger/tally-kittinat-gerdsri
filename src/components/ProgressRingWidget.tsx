import WidgetCard from "./WidgetCard";

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
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <WidgetCard color="slate" blob="bottom-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <div className="mt-2 flex flex-1 items-center justify-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg viewBox="0 0 72 72" className="h-24 w-24 -rotate-90">
            <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="8" stroke="var(--bg-soft)" />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              stroke="currentColor"
              className={`transition-all ${ringClassName}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="truncate font-display text-lg text-surface-foreground">{centerValue}</p>
          </div>
        </div>
      </div>
      {sublabel && <p className="mt-1 truncate text-center text-xs text-surface-foreground-soft">{sublabel}</p>}
    </WidgetCard>
  );
}
