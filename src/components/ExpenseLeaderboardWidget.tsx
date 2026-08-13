import WidgetCard from "./WidgetCard";

const RANK_CLASSES = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 dark:from-slate-500 dark:to-slate-600 dark:text-white",
  "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900 dark:from-orange-600 dark:to-orange-700 dark:text-white",
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
    <WidgetCard color="rose" blob="top-right" blobSize="h-28 w-28">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{title}</p>

      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${i === 0 ? "bg-rose-500/10" : ""}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm ${
                  RANK_CLASSES[i] ?? "bg-rose-900/10 text-rose-700 dark:bg-rose-100/10 dark:text-rose-300"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-foreground">{item.label}</span>
              <span className="shrink-0 text-sm font-semibold text-rose-700 dark:text-rose-300">{item.displayValue}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
