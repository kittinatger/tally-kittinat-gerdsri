export default function ComingSoonRow({ label, description }: { label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-5 opacity-60">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{description}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-bg-soft px-3 py-1.5 text-xs font-semibold text-ink-soft">
        Coming soon
      </span>
    </div>
  );
}
