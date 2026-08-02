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
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <p className={`mt-1.5 truncate font-display text-xl sm:text-2xl ${valueClassName ?? "text-surface-foreground"}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 truncate text-xs text-surface-foreground-soft">{sublabel}</p>}
    </div>
  );
}
