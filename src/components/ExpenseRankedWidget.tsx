export type ExpenseRankedItem = { label: string; value: number; displayValue: string; colorClassName: string };

// The expense counterpart to IncomeSourcesRankedWidget -- an avatar-badge
// ranked list in the rose/red palette instead of the plain bar-list used by
// ListStatWidget elsewhere.
export default function ExpenseRankedWidget({ title, items }: { title: string; items: ExpenseRankedItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="relative overflow-hidden rounded-card border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface p-4 dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-rose-400/20 blur-2xl dark:bg-rose-500/10" />

      <p className="relative mb-3 text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{title}</p>

      {items.length === 0 ? (
        <p className="relative text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="relative space-y-2.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${item.colorClassName}`}
              >
                {item.label.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{item.label}</span>
                  <span className="shrink-0 text-rose-700 dark:text-rose-300">{item.displayValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-900/10 dark:bg-rose-100/10">
                  <div
                    className={`h-full rounded-full ${item.colorClassName}`}
                    style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
