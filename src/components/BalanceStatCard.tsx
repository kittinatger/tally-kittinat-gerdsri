function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5V7h-2.5a2 2 0 0 0 0 4H15v.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 11.5v-5Z" />
      <path d="M12.5 8.5h2.75c.414 0 .75.336.75.75v0a.75.75 0 0 1-.75.75H12.5a1 1 0 1 1 0-2Z" />
    </svg>
  );
}

// The "Remaining"/balance counterpart to IncomeStatCard/ExpenseStatCard --
// same bold solid-card layout, in a navy/blue palette so it reads as its
// own "overall balance" language distinct from income (green) and expense
// (orange).
export default function BalanceStatCard({
  label,
  value,
  sublabel,
  currencyCode,
  negative,
  actionLabel = "Manage",
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-800 via-sky-900 to-[#0b1f38] p-4 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-400 text-sky-950 shadow-sm">
          <WalletIcon />
        </span>
        {currencyCode && (
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/90">
            {currencyCode}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex-1">
        <p className="text-sm text-white/60">{label}</p>
        <p className={`mt-1 truncate font-display text-2xl sm:text-3xl ${negative ? "text-red-300" : "text-white"}`}>{value}</p>
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
