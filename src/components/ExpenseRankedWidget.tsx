import WidgetCard from "./WidgetCard";

export type ExpenseRankedItem = { label: string; value: number; displayValue: string; colorClassName: string };

// The expense counterpart to IncomeSourcesRankedWidget -- an avatar-badge
// ranked list in the rose/red palette instead of the plain bar-list used by
// ListStatWidget elsewhere.
export default function ExpenseRankedWidget({ title, items }: { title: string; items: ExpenseRankedItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <WidgetCard color="rose" blob="top-right" blobSize="h-28 w-28">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{title}</p>

      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="relative shrink-0">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${item.colorClassName}`}
                >
                  {item.label.charAt(0).toUpperCase()}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[9px] font-bold text-rose-700 ring-1 ring-rose-200 dark:text-rose-300 dark:ring-rose-900/60">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{item.label}</span>
                  <span className="shrink-0 font-semibold text-rose-700 dark:text-rose-300">{item.displayValue}</span>
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
    </WidgetCard>
  );
}
