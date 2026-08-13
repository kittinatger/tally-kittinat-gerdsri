import WidgetCard from "./WidgetCard";

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
    <WidgetCard color="violet" blob="bottom-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700/80 dark:text-violet-300/80">Savings goals</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-surface-foreground-soft">No savings goals yet — add one in Settings.</p>
      ) : (
        <div className="mt-3 space-y-3.5">
          {items.map((it) => {
            const percent = it.target > 0 ? (it.current / it.target) * 100 : 0;
            return (
              <div key={it.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-surface-foreground">{it.name}</span>
                  <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                    {it.displayCurrent} / {it.displayTarget}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-violet-900/10 dark:bg-violet-100/10">
                  <div
                    className={`h-full rounded-full transition-all ${it.colorClassName}`}
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
