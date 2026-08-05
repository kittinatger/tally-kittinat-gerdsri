export type SavingsGoalItem = {
  name: string;
  current: number;
  target: number;
  displayCurrent: string;
  displayTarget: string;
  colorClassName: string;
};

export default function SavingsGoalsWidget({ items }: { items: SavingsGoalItem[] }) {
  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">Savings goals</p>
      {items.length === 0 ? (
        <p className="text-sm text-surface-foreground-soft">No savings goals yet — add one in Settings.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const percent = it.target > 0 ? (it.current / it.target) * 100 : 0;
            return (
              <div key={it.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{it.name}</span>
                  <span className="shrink-0 text-surface-foreground-soft">
                    {it.displayCurrent} / {it.displayTarget}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className={`h-full rounded-full ${it.colorClassName}`}
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
