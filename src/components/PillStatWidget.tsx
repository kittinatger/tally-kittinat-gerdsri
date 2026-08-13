export default function PillStatWidget({
  icon,
  label,
  value,
  badge,
  pillClassName = "border border-surface-line bg-surface text-surface-foreground",
  iconBgClassName = "bg-surface-accent/15 text-surface-accent",
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
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${iconBgClassName}`}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
      {badge && <span className="shrink-0 rounded-full bg-bg-soft px-2 py-0.5 text-xs font-bold">{badge}</span>}
      <span className="shrink-0 text-sm font-bold">{value}</span>
    </div>
  );
}
