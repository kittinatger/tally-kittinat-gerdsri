import WidgetCard, { WIDGET_GRADIENT_TEXT } from "./WidgetCard";

function DownLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 5L5 15M5 15V7M5 15H13" />
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

// The income counterpart to ExpenseStatCard -- same soft-pastel layout in
// the app's emerald accent, giving "money coming in" its own visual
// language. A diagonal gradient badge and gradient-text value give it more
// presence than a flat stat tile.
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
    <WidgetCard color="emerald">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm">
          <DownLeftIcon />
        </span>
        {trend ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {trend.positive ? <TrendUpIcon /> : <TrendDownIcon />} {trend.label}
          </span>
        ) : (
          currencyCode && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {currencyCode}
            </span>
          )
        )}
      </div>

      <div className="mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">{label}</p>
        <p className={`mt-1 truncate bg-gradient-to-br bg-clip-text font-display text-2xl text-transparent sm:text-3xl ${WIDGET_GRADIENT_TEXT.emerald}`}>
          {value}
        </p>
        {sublabel && <p className="mt-1 truncate text-xs text-emerald-700/60 dark:text-emerald-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-3 w-full rounded-full bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          {actionLabel}
        </button>
      )}
    </WidgetCard>
  );
}
