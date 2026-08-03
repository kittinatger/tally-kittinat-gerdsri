export default function PillStatWidget({
  icon,
  label,
  value,
  badge,
  pillClassName = "bg-[#101010] text-white",
  iconBgClassName = "bg-white/15",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: string;
  pillClassName?: string;
  iconBgClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-full px-3.5 py-2.5 shadow-soft ${pillClassName}`}>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconBgClassName}`}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
      {badge && <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">{badge}</span>}
      <span className="shrink-0 text-sm font-bold">{value}</span>
    </div>
  );
}
