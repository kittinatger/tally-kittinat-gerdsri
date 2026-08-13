import { useId } from "react";
import WidgetCard, { WIDGET_GRADIENT_TEXT } from "./WidgetCard";

// A filled gradient area chart, part of the income widgets' distinct
// emerald "money coming in" visual language.
export default function IncomeAreaSparkWidget({
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
    <WidgetCard color="emerald" blob="bottom-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">{label}</p>
      <p className={`mt-1 truncate bg-gradient-to-br bg-clip-text font-display text-2xl text-transparent sm:text-3xl ${WIDGET_GRADIENT_TEXT.emerald}`}>
        {value}
      </p>

      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="relative mt-2 h-12 w-full text-emerald-500">
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
    </WidgetCard>
  );
}
