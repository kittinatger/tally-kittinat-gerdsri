export default function AlertPillWidget({
  icon,
  title,
  subtitle,
  percent,
  ringClassName = "text-emerald-400",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  percent: number;
  ringClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex items-center gap-3 rounded-full border border-surface-line bg-surface px-3.5 py-2.5 shadow-soft">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-foreground">{title}</p>
        <p className="truncate text-xs text-surface-foreground-soft">{subtitle}</p>
      </div>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0 -rotate-90">
        <circle cx="16" cy="16" r={radius} fill="none" strokeWidth="3.5" stroke="var(--bg-soft)" />
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          className={`transition-all ${ringClassName}`}
        />
      </svg>
    </div>
  );
}
