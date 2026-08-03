export default function ActionStatWidget({
  label,
  value,
  icon,
  onClick,
  valueClassName = "text-surface-foreground",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  onClick: () => void;
  valueClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-card border border-surface-line bg-surface p-4 text-left transition hover:border-surface-accent"
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
        <span className="h-3.5 w-3.5 shrink-0 text-surface-foreground-soft">{icon}</span>
      </div>
      <p className={`mt-1.5 truncate font-display text-xl sm:text-2xl ${valueClassName}`}>{value}</p>
    </button>
  );
}
