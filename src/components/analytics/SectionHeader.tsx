// Shared title row for every Analytics section: a small colored icon badge
// next to the (translated) title/description, with an optional trailing
// control cluster (chart-type dropdown, "Manage" link, ...). Centralizing
// this means every section reads as one family instead of six slightly
// different header layouts.
export default function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">{icon}</span>
        <div>
          <h2 className="font-display text-lg text-foreground">{title}</h2>
          {description && <p className="text-xs text-ink-soft">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
