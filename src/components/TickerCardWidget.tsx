export default function TickerCardWidget({
  icon,
  name,
  value,
  deltaLabel,
  deltaPositive,
  points,
  accentClassName = "text-emerald-400",
}: {
  icon: React.ReactNode;
  name: string;
  value: string;
  deltaLabel: string;
  deltaPositive: boolean;
  points: number[];
  accentClassName?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 26;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i) => `${i * step},${height - ((p - min) / range) * height}`).join(" ");
  const avgY = height - ((points.reduce((a, b) => a + b, 0) / points.length - min) / range) * height;

  return (
    <div className="rounded-card border border-[#1f1f1f] bg-[#0b0b0c] p-4 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">{icon}</span>
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-wide text-white/50">{name}</p>
          </div>
        </div>
        <p className="shrink-0 text-[10px] text-white/40">Updated now</p>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="truncate text-2xl font-semibold">{value}</p>
        <span className={`shrink-0 text-xs font-semibold ${deltaPositive ? accentClassName : "text-red-400"}`}>{deltaLabel}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-2 h-9 w-full">
        <line x1="0" y1={avgY} x2={width} y2={avgY} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" strokeWidth="0.7" />
        <polyline points={coords} fill="none" strokeWidth="2" className={accentClassName} stroke="currentColor" />
      </svg>
    </div>
  );
}
