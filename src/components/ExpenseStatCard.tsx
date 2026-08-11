function UpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 15L15 5M15 5H7M15 5V13" />
    </svg>
  );
}

// The expense counterpart to IncomeStatCard -- a bold, solid burnt-orange
// card in the same layout (currency pill + circular direction badge + a
// bottom action pill), giving "money going out" its own visual language.
export default function ExpenseStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  trend,
  actionLabel = "Top up",
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-600 via-orange-700 to-[#5c1d10] p-4 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-orange-300/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400 text-orange-950 shadow-sm">
          <UpRightIcon />
        </span>
        {trend ? (
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
              trend.positive ? "bg-red-300/25 text-red-100" : "bg-emerald-300/25 text-emerald-100"
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
        <p className="text-sm text-white/70">{label}</p>
        <p className="mt-1 truncate font-display text-2xl text-white sm:text-3xl">
          {value.startsWith("-") ? value : `- ${value}`}
        </p>
        {sublabel && <p className="mt-1 truncate text-xs text-white/55">{sublabel}</p>}
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
