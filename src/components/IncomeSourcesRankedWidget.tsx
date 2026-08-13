import WidgetCard from "./WidgetCard";

export type IncomeSourceItem = { label: string; value: number; displayValue: string; colorClassName: string };

// A ranked list styled like an avatar leaderboard (initial badge, rank
// number, name, a slim progress bar, amount) -- distinct from the plain
// bar-list used by ListStatWidget elsewhere, to give income sources their
// own identity.
export default function IncomeSourcesRankedWidget({ title, items }: { title: string; items: IncomeSourceItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <WidgetCard color="emerald" blob="top-right" blobSize="h-28 w-28">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No income yet.</p>
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
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-900/60">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{item.label}</span>
                  <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-300">{item.displayValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-900/10 dark:bg-emerald-100/10">
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
