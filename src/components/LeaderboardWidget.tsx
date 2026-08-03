const RANK_CLASSES = [
  "bg-amber-400 text-white",
  "bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-white",
  "bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white",
];

export default function LeaderboardWidget({
  title,
  items,
}: {
  title: string;
  items: { label: string; displayValue: string }[];
}) {
  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  RANK_CLASSES[i] ?? "bg-bg-soft text-surface-foreground-soft"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-foreground">{item.label}</span>
              <span className="shrink-0 text-sm text-surface-foreground-soft">{item.displayValue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
