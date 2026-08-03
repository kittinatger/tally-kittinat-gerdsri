export default function TrendStatWidget({
  label,
  value,
  deltaLabel,
  direction,
}: {
  label: string;
  value: string;
  deltaLabel: string;
  direction: "up" | "down" | "flat";
}) {
  const color =
    direction === "up"
      ? "text-red-600 dark:text-red-400"
      : direction === "down"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-surface-foreground-soft";

  return (
    <div className="rounded-card border border-surface-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-foreground-soft">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 shrink-0 ${color}`}>
          {direction === "up" && <path d="M10 4l6 7h-4v5H8v-5H4l6-7z" />}
          {direction === "down" && <path d="M10 16l-6-7h4V4h4v5h4l-6 7z" />}
          {direction === "flat" && <rect x="3" y="9" width="14" height="2" rx="1" />}
        </svg>
        <p className={`truncate font-display text-xl sm:text-2xl ${color}`}>{value}</p>
      </div>
      <p className="mt-1 truncate text-xs text-surface-foreground-soft">{deltaLabel}</p>
    </div>
  );
}
