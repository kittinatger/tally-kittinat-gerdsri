// The wallet counterpart to IncomeStatCard/ExpenseStatCard -- a sky/blue
// gradient card with a glow blob, giving "money in wallets" its own
// visual language distinct from income (emerald) and expense (rose).
export default function WalletStatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-sky-200/70 bg-gradient-to-br from-sky-50 via-surface to-surface p-4 shadow-sm dark:border-sky-900/50 dark:from-sky-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-sky-400/25 blur-2xl dark:bg-sky-500/15" />

      <p className="relative text-xs font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">{label}</p>
      <p className="relative mt-2 truncate font-display text-xl text-sky-700 dark:text-sky-300 sm:text-2xl">{value}</p>
      {sublabel && <p className="relative mt-1 truncate text-xs text-sky-700/60 dark:text-sky-400/70">{sublabel}</p>}
    </div>
  );
}
