export default function SparklineWidget({
  label,
  value,
  points,
  lineClassName = "text-surface-accent",
}: {
  label: string;
  value: string;
  points: number[];
  lineClassName?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i) => `${i * step},${height - ((p - min) / range) * height}`).join(" ");

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <p className="mt-1 truncate font-display text-xl text-surface-foreground sm:text-2xl">{value}</p>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-2 h-10 w-full">
        <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="2.5" className={lineClassName} />
      </svg>
    </div>
  );
}
