function DownLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M15 5L5 15M5 15V7M5 15H13" />
    </svg>
  );
}

// The shared visual identity for income widgets: a soft emerald gradient
// card with a glow blob, direction badge and currency pill -- distinct from
// the neutral gray StatWidget used elsewhere, but toned to the app's own
// pastel palette rather than a saturated standalone look.
export default function IncomeStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  trend,
  actionLabel = "Add income",
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  currencyCode?: string;
  trend?: { label: string; positive: boolean };
  actionLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-card border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-surface to-surface p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/25 blur-2xl dark:bg-emerald-500/15" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <DownLeftIcon />
        </span>
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.label}
          </span>
        ) : (
          currencyCode && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {currencyCode}
            </span>
          )
        )}
      </div>

      <div className="relative mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">{label}</p>
        <p className="mt-1 truncate font-display text-xl text-emerald-700 dark:text-emerald-300 sm:text-2xl">{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-emerald-700/60 dark:text-emerald-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="relative mt-3 w-full rounded-full bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
