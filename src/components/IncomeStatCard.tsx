function DownLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 5L5 15M5 15V7M5 15H13" />
    </svg>
  );
}

// The shared visual identity for income widgets: a bold, solid dark-emerald
// card (currency pill + circular direction badge + a bottom action pill),
// distinct from the neutral gray StatWidget used elsewhere -- income should
// read as its own "money coming in" language at a glance.
export default function IncomeStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  trend,
  actionLabel = "Withdraw",
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-[#0b2b28] p-4 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 shadow-sm">
          <DownLeftIcon />
        </span>
        {trend ? (
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
              trend.positive ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.label}
          </span>
        ) : (
          currencyCode && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/90">
              {currencyCode}
            </span>
          )
        )}
      </div>

      <div className="relative mt-4 flex-1">
        <p className="text-sm text-white/60">{label}</p>
        <p className="mt-1 truncate font-display text-2xl text-white sm:text-3xl">{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-white/50">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="relative mt-4 w-full rounded-2xl bg-white/15 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
