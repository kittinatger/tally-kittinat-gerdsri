// Small "+4.1% vs last period" pill shared by every stat card on the
// Analytics page (net worth hero, income/expense/net stat cards). Pure
// presentational — callers decide what "positive" means (a bigger expense
// is bad, a bigger income is good) via the `positive` flag.
function ArrowIcon({ up, className }: { up: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: up ? undefined : "scaleY(-1)" }}
    >
      <path d="M10 15.5V4.5M10 4.5 5 9.5M10 4.5l5 5" />
    </svg>
  );
}

export default function DeltaBadge({
  pct,
  positive,
  label,
  tone = "soft",
}: {
  pct: number;
  positive: boolean;
  /** Shown as this badge's title/tooltip always; only rendered inline too
   * when there's room (see `showLabel`) — a narrow stat card just gets the
   * percentage, a wider one (or the hero card) can afford the full phrase. */
  label: string;
  /** "soft" (tinted pill, used on WidgetCard's pastel surfaces) or "onDark"
   * (translucent white, used on the gradient hero card). */
  tone?: "soft" | "onDark";
}) {
  const up = pct >= 0;
  const soft = positive
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "bg-red-500/10 text-red-600 dark:text-red-400";
  const onDark = positive ? "bg-white/20 text-white" : "bg-black/20 text-white";

  return (
    <span
      title={`${up ? "+" : ""}${pct}% ${label}`}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${
        tone === "onDark" ? onDark : soft
      }`}
    >
      <ArrowIcon up={up} className="h-2.5 w-2.5 shrink-0" />
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}
