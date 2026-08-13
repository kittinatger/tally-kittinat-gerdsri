import WidgetCard, { WIDGET_GRADIENT_TEXT } from "./WidgetCard";

function UpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 15L15 5M15 5H7M15 5V13" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
      <path d="M2 8.5 5 5.5 7 7.5 10 3.5M10 3.5H7M10 3.5V6.5" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
      <path d="M2 3.5 5 6.5 7 4.5 10 8.5M10 8.5H7M10 8.5V5.5" />
    </svg>
  );
}

// The expense counterpart to IncomeStatCard -- same soft-pastel layout in
// the app's rose accent, giving "money going out" its own visual language
// without breaking from Tally's toned-down look. A diagonal gradient badge
// and gradient-text value give it more presence than a flat stat tile.
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
    <WidgetCard color="rose">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-sm">
          <UpRightIcon />
        </span>
        {trend ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {trend.positive ? <TrendUpIcon /> : <TrendDownIcon />} {trend.label}
          </span>
        ) : (
          currencyCode && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
              {currencyCode}
            </span>
          )
        )}
      </div>

      <div className="mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{label}</p>
        <p className={`mt-1 truncate bg-gradient-to-br bg-clip-text font-display text-2xl text-transparent sm:text-3xl ${WIDGET_GRADIENT_TEXT.rose}`}>
          {value}
        </p>
        {sublabel && <p className="mt-1 truncate text-xs text-rose-700/60 dark:text-rose-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-3 w-full rounded-full bg-rose-500/10 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300"
        >
          {actionLabel}
        </button>
      )}
    </WidgetCard>
  );
}
