import { useId } from "react";

// The expense counterpart to IncomeAreaSparkWidget -- a filled gradient
// area chart in the rose/red palette instead of the plain line used by
// SparklineWidget elsewhere.
export default function ExpenseAreaSparkWidget({
  label,
  value,
  points,
}: {
  label: string;
  value: string;
  points: number[];
}) {
  const gradientId = useId();
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 36;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i): [number, number] => [i * step, height - ((p - min) / range) * height]);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <div className="relative overflow-hidden rounded-card border border-rose-200/70 bg-gradient-to-br from-rose-50 via-surface to-surface p-4 dark:border-rose-900/50 dark:from-rose-950/40 dark:via-surface dark:to-surface">
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-rose-400/20 blur-2xl dark:bg-rose-500/10" />

      <p className="relative text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">{label}</p>
      <p className="relative mt-1 truncate font-display text-xl text-rose-700 dark:text-rose-300 sm:text-2xl">{value}</p>

      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="relative mt-2 h-12 w-full text-rose-500">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill="currentColor" />}
      </svg>
    </div>
  );
}
