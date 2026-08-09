const RANK_CLASSES = [
  "bg-amber-400 text-white",
  "bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-white",
  "bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white",
];

// The expense counterpart to LeaderboardWidget -- same podium-medal ranking,
// wrapped in the rose/red gradient card used across the other expense
// widgets so a leaderboard reads as part of the same visual family.
export default function ExpenseLeaderboardWidget({
  title,
  items,
}: {
  title: string;
  items: { label: string; displayValue: string }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface p-4 dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-rose-400/20 blur-2xl dark:bg-rose-500/10" />

      <p className="relative mb-3 text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{title}</p>

      {items.length === 0 ? (
        <p className="relative text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="relative space-y-2">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  RANK_CLASSES[i] ?? "bg-rose-900/10 text-rose-700 dark:bg-rose-100/10 dark:text-rose-300"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-foreground">{item.label}</span>
              <span className="shrink-0 text-sm text-rose-700 dark:text-rose-300">{item.displayValue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
