import { CheckIcon } from "@/lib/icons";

export default function WeekdayTrackerWidget({
  value,
  label,
  days,
  cardClassName = "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
}: {
  value: string;
  label: string;
  days: { label: string; hit: boolean }[];
  cardClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-card p-4 shadow-sm ${cardClassName}`}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="truncate text-2xl font-bold">{value}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 14l4-4 3 3 6-6" />
            <path d="M13 6h4v4" />
          </svg>
        </span>
      </div>
      <p className="relative mt-0.5 truncate text-xs font-medium opacity-80">{label}</p>
      <div className="relative mt-3 grid grid-cols-7 gap-1.5 text-center">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                d.hit ? "bg-white/25" : "bg-black/15"
              }`}
            >
              {d.hit ? <CheckIcon className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current opacity-70" />}
            </span>
            <span className="text-[9px] font-semibold uppercase opacity-70">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
