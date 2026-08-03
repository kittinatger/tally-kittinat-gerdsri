export default function HeatmapWidget({
  title,
  cells,
  colorClassName = "bg-surface-accent",
}: {
  title: string;
  /** intensity 0-1 */
  cells: { date: string; intensity: number }[];
  colorClassName?: string;
}) {
  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{title}</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
        {cells.map((c) => (
          <div
            key={c.date}
            title={c.date}
            className={`aspect-square rounded-[3px] ${c.intensity > 0 ? colorClassName : "bg-bg-soft"}`}
            style={{ opacity: c.intensity > 0 ? Math.max(0.2, c.intensity) : 1 }}
          />
        ))}
      </div>
    </div>
  );
}
