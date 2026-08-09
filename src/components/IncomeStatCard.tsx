function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3 w-3">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

// The shared visual identity for income widgets: a soft emerald gradient
// card with a blurred glow blob, distinct from the neutral gray StatWidget
// used everywhere else -- income should read as its own "money coming in"
// language at a glance.
export default function IncomeStatCard({
  label,
  value,
  sublabel,
  trend,
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { label: string; positive: boolean };
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-card border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-surface to-surface p-4 text-left shadow-sm transition dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-surface dark:to-surface ${
        onClick ? "hover:border-emerald-400 dark:hover:border-emerald-600" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/25 blur-2xl dark:bg-emerald-500/15" />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">{label}</p>
        {trend && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.label}
          </span>
        )}
        {onClick && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition group-hover:scale-105">
            <PlusIcon />
          </span>
        )}
      </div>

      <p className="relative mt-2 truncate font-display text-xl text-emerald-700 dark:text-emerald-300 sm:text-2xl">{value}</p>
      {sublabel && <p className="relative mt-1 truncate text-xs text-emerald-700/60 dark:text-emerald-400/70">{sublabel}</p>}
    </Wrapper>
  );
}
