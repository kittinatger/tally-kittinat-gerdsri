export type BudgetItem = {
  category: string;
  spent: number;
  limit: number;
  displaySpent: string;
  displayLimit: string;
  colorClassName: string;
};

export default function BudgetOverviewWidget({ items }: { items: BudgetItem[] }) {
  return (
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Budgets</p>
      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No budgets set yet — add one in Settings.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const percent = it.limit > 0 ? (it.spent / it.limit) * 100 : 0;
            const over = percent > 100;
            return (
              <div key={it.category}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{it.category}</span>
                  <span className={`shrink-0 ${over ? "text-red-600 dark:text-red-400" : "text-surface-foreground-soft"}`}>
                    {it.displaySpent} / {it.displayLimit}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-500" : it.colorClassName}`}
                    style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
