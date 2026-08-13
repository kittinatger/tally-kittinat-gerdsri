import { useId } from "react";
import WidgetCard from "./WidgetCard";

export default function TickerCardWidget({
  icon,
  name,
  value,
  deltaLabel,
  deltaPositive,
  points,
  accentClassName = "text-sky-600 dark:text-sky-400",
}: {
  icon: React.ReactNode;
  name: string;
  value: string;
  deltaLabel: string;
  deltaPositive: boolean;
  points: number[];
  accentClassName?: string;
}) {
  const gradientId = useId();
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i): [number, number] => [i * step, height - ((p - min) / range) * height]);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <WidgetCard color="slate" blob="bottom-right">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-soft">{icon}</span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-surface-foreground-soft">{name}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            deltaPositive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {deltaLabel}
        </span>
      </div>
      <p className="mt-2.5 truncate font-display text-2xl text-surface-foreground">{value}</p>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`mt-2 h-10 w-full ${accentClassName}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill="currentColor" />}
      </svg>
    </WidgetCard>
  );
}
