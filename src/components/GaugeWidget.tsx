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
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <svg viewBox="0 0 84 46" className="mx-auto h-16 w-full max-w-[140px]">
        <path
          d="M 6 44 A 36 36 0 0 1 78 44"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="var(--bg-soft)"
        />
        <path
          d="M 6 44 A 36 36 0 0 1 78 44"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="currentColor"
          className={needleClassName}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
        <line
          x1="42"
          y1="44"
          x2={42 + 26 * Math.cos((angle * Math.PI) / 180)}
          y2={44 + 26 * Math.sin((angle * Math.PI) / 180)}
          stroke="var(--foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="42" cy="44" r="2.5" fill="var(--foreground)" />
      </svg>
      <p className="text-center font-display text-lg text-surface-foreground">{Math.round(clamped)}%</p>
      {sublabel && <p className="text-center text-xs text-surface-foreground-soft">{sublabel}</p>}
    </div>
  );
}
