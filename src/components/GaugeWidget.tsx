import WidgetCard from "./WidgetCard";

export default function GaugeWidget({
  label,
  percent,
  sublabel,
  needleClassName = "text-surface-accent",
}: {
  label: string;
  percent: number;
  sublabel?: string;
  needleClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const angle = -90 + (clamped / 100) * 180;
  const radius = 34;
  const circumference = Math.PI * radius;

  return (
    <WidgetCard color="slate">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <div className="mt-1 flex flex-1 flex-col items-center justify-center">
        <svg viewBox="0 0 84 46" className="mx-auto h-20 w-full max-w-[160px]">
          <path d="M 6 44 A 36 36 0 0 1 78 44" fill="none" strokeWidth="9" strokeLinecap="round" stroke="var(--bg-soft)" />
          <path
            d="M 6 44 A 36 36 0 0 1 78 44"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            stroke="currentColor"
            className={`transition-all ${needleClassName}`}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
          />
          <circle
            cx={42 + 36 * Math.cos((angle * Math.PI) / 180)}
            cy={44 + 36 * Math.sin((angle * Math.PI) / 180)}
            r="3.2"
            className={needleClassName}
            fill="currentColor"
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
          <line
            x1="42"
            y1="44"
            x2={42 + 24 * Math.cos((angle * Math.PI) / 180)}
            y2={44 + 24 * Math.sin((angle * Math.PI) / 180)}
            stroke="var(--foreground)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="42" cy="44" r="3" fill="var(--foreground)" />
        </svg>
        <p className="-mt-1 font-display text-2xl text-surface-foreground">{Math.round(clamped)}%</p>
      </div>
      {sublabel && <p className="truncate text-center text-xs text-surface-foreground-soft">{sublabel}</p>}
    </WidgetCard>
  );
}
