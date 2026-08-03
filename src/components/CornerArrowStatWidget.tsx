export default function CornerArrowStatWidget({
  value,
  label,
  bars,
  cardClassName = "bg-emerald-600 text-white",
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
    <div className={`rounded-card p-4 ${cardClassName}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-2xl font-bold">{value}</p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M5 15L15 5M15 5H7M15 5v8" />
          </svg>
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs font-medium opacity-80">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-1">
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
