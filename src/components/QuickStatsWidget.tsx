export type QuickStat = { label: string; value: string; valueClassName?: string };

export default function QuickStatsWidget({ title, stats }: { title: string; stats: QuickStat[] }) {
  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[11px] text-surface-foreground-soft">{s.label}</p>
            <p className={`mt-0.5 truncate font-display text-lg ${s.valueClassName ?? "text-surface-foreground"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
