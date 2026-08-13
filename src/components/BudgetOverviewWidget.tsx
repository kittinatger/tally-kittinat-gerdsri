import WidgetCard from "./WidgetCard";

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
    <WidgetCard color="orange" blob="bottom-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/80 dark:text-orange-300/80">Budgets</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-surface-foreground-soft">No budgets set yet — add one in Settings.</p>
      ) : (
        <div className="mt-3 space-y-3.5">
          {items.map((it) => {
            const percent = it.limit > 0 ? (it.spent / it.limit) * 100 : 0;
            const over = percent > 100;
            return (
              <div key={it.category}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{it.category}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      over ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {it.displaySpent} / {it.displayLimit}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-orange-900/10 dark:bg-orange-100/10">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : it.colorClassName}`}
                    style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
