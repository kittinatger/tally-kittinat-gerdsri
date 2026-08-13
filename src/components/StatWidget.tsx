import WidgetCard from "./WidgetCard";

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
    <WidgetCard color="slate">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-surface-accent/50" />
      </div>
      <p className={`mt-2 truncate font-display text-2xl sm:text-3xl ${valueClassName ?? "text-surface-foreground"}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 truncate text-xs text-surface-foreground-soft">{sublabel}</p>}
    </WidgetCard>
  );
}
