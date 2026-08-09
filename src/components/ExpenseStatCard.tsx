function MinusCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3 w-3">
      <path d="M4 10h12" />
    </svg>
  );
}

// The expense counterpart to IncomeStatCard -- a rose/red gradient card with
// a glow blob, giving "money going out" its own visual language distinct
// from the neutral gray StatWidget used elsewhere.
export default function ExpenseStatCard({
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
      className={`group relative w-full overflow-hidden rounded-card border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface p-4 text-left shadow-sm transition dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface ${
        onClick ? "hover:border-rose-400 dark:hover:border-rose-600" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-rose-400/25 blur-2xl dark:bg-rose-500/15" />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{label}</p>
        {trend && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.label}
          </span>
        )}
        {onClick && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition group-hover:scale-105">
            <MinusCircleIcon />
          </span>
        )}
      </div>

      <p className="relative mt-2 truncate font-display text-xl text-rose-700 dark:text-rose-300 sm:text-2xl">{value}</p>
      {sublabel && <p className="relative mt-1 truncate text-xs text-rose-700/60 dark:text-rose-400/70">{sublabel}</p>}
    </Wrapper>
  );
}
