export default function WeekdayTrackerWidget({
  value,
  label,
  days,
  cardClassName = "bg-emerald-500 text-white",
}: {
  value: string;
  label: string;
  days: { label: string; hit: boolean; display: string }[];
  cardClassName?: string;
}) {
  return (
    <div className={`rounded-card p-4 ${cardClassName}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-2xl font-bold">{value}</p>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 opacity-90">
          <path d="M4 14l4-4 3 3 6-6" />
          <path d="M13 6h4v4" />
        </svg>
      </div>
      <p className="mt-0.5 truncate text-xs font-medium opacity-80">{label}</p>
      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                d.hit ? "bg-white/25" : "bg-black/15"
              }`}
            >
              {d.display}
            </span>
            <span className="text-[9px] font-semibold uppercase opacity-70">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
