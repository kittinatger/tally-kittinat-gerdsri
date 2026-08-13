import WidgetCard, { WIDGET_GRADIENT_TEXT } from "./WidgetCard";

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5V7h-2.5a2 2 0 0 0 0 4H15v.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 11.5v-5Z" />
      <path d="M12.5 8.5h2.75c.414 0 .75.336.75.75v0a.75.75 0 0 1-.75.75H12.5a1 1 0 1 1 0-2Z" />
    </svg>
  );
}

// The "Remaining"/total-balance counterpart to IncomeStatCard/
// ExpenseStatCard — its own blue accent (distinct from both income/emerald,
// expense/rose, and the sky used for individual wallets), so "overall
// balance" reads as a third, clearly separate visual language.
export default function BalanceStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  negative,
  actionLabel = "Edit balance",
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  currencyCode?: string;
  negative?: boolean;
  actionLabel?: string;
  onClick?: () => void;
}) {
  return (
    <WidgetCard color="blue">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
          <WalletIcon />
        </span>
        {currencyCode && (
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
            {currencyCode}
          </span>
        )}
      </div>

      <div className="mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700/80 dark:text-blue-300/80">{label}</p>
        <p
          className={`mt-1 truncate font-display text-2xl sm:text-3xl ${
            negative
              ? "text-red-600 dark:text-red-400"
              : `bg-gradient-to-br bg-clip-text text-transparent ${WIDGET_GRADIENT_TEXT.blue}`
          }`}
        >
          {value}
        </p>
        {sublabel && <p className="mt-1 truncate text-xs text-blue-700/60 dark:text-blue-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-3 w-full rounded-full bg-blue-500/10 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-500/20 dark:text-blue-300"
        >
          {actionLabel}
        </button>
      )}
    </WidgetCard>
  );
}
