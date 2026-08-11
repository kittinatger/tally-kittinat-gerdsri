function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5V7h-2.5a2 2 0 0 0 0 4H15v.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 11.5v-5Z" />
      <path d="M12.5 8.5h2.75c.414 0 .75.336.75.75v0a.75.75 0 0 1-.75.75H12.5a1 1 0 1 1 0-2Z" />
    </svg>
  );
}

// The "Remaining"/balance counterpart to IncomeStatCard/ExpenseStatCard --
// same soft-pastel layout in the app's sky/wallet accent, so it reads as
// its own "overall balance" language without breaking from the app's
// toned-down look.
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-card border border-sky-200/70 bg-gradient-to-br from-sky-50 via-surface to-surface p-4 shadow-sm dark:border-sky-900/50 dark:from-sky-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-sky-400/25 blur-2xl dark:bg-sky-500/15" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
          <WalletIcon />
        </span>
        {currencyCode && (
          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
            {currencyCode}
          </span>
        )}
      </div>

      <div className="relative mt-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">{label}</p>
        <p
          className={`mt-1 truncate font-display text-xl sm:text-2xl ${
            negative ? "text-red-600 dark:text-red-400" : "text-sky-700 dark:text-sky-300"
          }`}
        >
          {value}
        </p>
        {sublabel && <p className="mt-1 truncate text-xs text-sky-700/60 dark:text-sky-400/70">{sublabel}</p>}
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="relative mt-3 w-full rounded-full bg-sky-500/10 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-500/20 dark:text-sky-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
