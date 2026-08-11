function UpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M5 15L15 5M15 5H7M15 5V13" />
    </svg>
  );
}

// The expense counterpart to IncomeStatCard -- same soft-pastel layout in
// the app's rose accent, giving "money going out" its own visual language
// without breaking from Tally's toned-down look.
export default function ExpenseStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  trend,
  actionLabel = "Add expense",
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-card border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface p-4 shadow-sm dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-rose-400/25 blur-2xl dark:bg-rose-500/15" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
          <UpRightIcon />
        </span>
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.label}
          </span>
        ) : (
          currencyCode && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
              {currencyCode}
            </span>
          )
        )}
      </div>

      <div className="relative mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{label}</p>
        <p className="mt-1 truncate font-display text-xl text-rose-700 dark:text-rose-300 sm:text-2xl">{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-rose-700/60 dark:text-rose-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="relative mt-3 w-full rounded-full bg-rose-500/10 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
