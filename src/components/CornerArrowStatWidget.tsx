export default function CornerArrowStatWidget({
  value,
  label,
  bars,
  cardClassName = "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  barClassName = "bg-white/30",
  activeBarClassName = "bg-white",
}: {
  value: string;
  label: string;
  bars: { label: string; active: boolean }[];
  cardClassName?: string;
  barClassName?: string;
  activeBarClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-card p-4 shadow-sm ${cardClassName}`}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="truncate text-2xl font-bold">{value}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M5 15L15 5M15 5H7M15 5v8" />
          </svg>
        </span>
      </div>
      <p className="relative mt-0.5 truncate text-xs font-medium opacity-80">{label}</p>
      <div className="relative mt-3 flex items-end justify-between gap-1">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className={`h-6 w-1.5 rounded-full ${b.active ? activeBarClassName : barClassName}`} />
            <span className="text-[9px] font-semibold uppercase opacity-70">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
