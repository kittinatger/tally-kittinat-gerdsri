export default function StatWidget({
  label,
  value,
  sublabel,
  valueClassName,
}: {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
}) {
  return (
    <div className="widget-gradient-card rounded-card border border-surface-line p-4">
      <p className="relative text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <p className={`relative mt-1.5 truncate font-display text-xl sm:text-2xl ${valueClassName ?? "text-surface-foreground"}`}>
        {value}
      </p>
      {sublabel && <p className="relative mt-1 truncate text-xs text-surface-foreground-soft">{sublabel}</p>}
    </div>
  );
}
