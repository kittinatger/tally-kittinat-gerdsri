import type { CategoryColor } from "@/lib/categories";

// Shared gradient-glow card shell for every Dashboard widget, replacing two
// conventions that used to coexist: the neutral `.widget-gradient-card` CSS
// class (always the app's single brand green) and ~9 files that each
// hand-duplicated the same rose/emerald/sky gradient+blob markup with their
// own hue hardcoded in. Full literal class strings per color (not template
// interpolation) so Tailwind's build-time scanner can actually see and
// generate them — same approach as badgeClasses()/dotClasses() in
// category-styles.ts.
type BlobPosition = "top-right" | "bottom-left" | "top-left" | "bottom-right";

const BORDER: Record<CategoryColor, string> = {
  emerald: "border-emerald-200/70 dark:border-emerald-900/50",
  green: "border-green-200/70 dark:border-green-900/50",
  teal: "border-teal-200/70 dark:border-teal-900/50",
  cyan: "border-cyan-200/70 dark:border-cyan-900/50",
  sky: "border-sky-200/70 dark:border-sky-900/50",
  blue: "border-blue-200/70 dark:border-blue-900/50",
  indigo: "border-indigo-200/70 dark:border-indigo-900/50",
  violet: "border-violet-200/70 dark:border-violet-900/50",
  fuchsia: "border-fuchsia-200/70 dark:border-fuchsia-900/50",
  pink: "border-pink-200/70 dark:border-pink-900/50",
  rose: "border-rose-200/70 dark:border-rose-900/50",
  orange: "border-orange-200/70 dark:border-orange-900/50",
  amber: "border-amber-200/70 dark:border-amber-900/50",
  lime: "border-lime-200/70 dark:border-lime-900/50",
  slate: "border-surface-line",
};

const FROM: Record<CategoryColor, string> = {
  emerald: "from-emerald-50 dark:from-emerald-950/40",
  green: "from-green-50 dark:from-green-950/40",
  teal: "from-teal-50 dark:from-teal-950/40",
  cyan: "from-cyan-50 dark:from-cyan-950/40",
  sky: "from-sky-50 dark:from-sky-950/40",
  blue: "from-blue-50 dark:from-blue-950/40",
  indigo: "from-indigo-50 dark:from-indigo-950/40",
  violet: "from-violet-50 dark:from-violet-950/40",
  fuchsia: "from-fuchsia-50 dark:from-fuchsia-950/40",
  pink: "from-pink-50 dark:from-pink-950/40",
  rose: "from-rose-50 dark:from-rose-950/40",
  orange: "from-orange-50 dark:from-orange-950/40",
  amber: "from-amber-50 dark:from-amber-950/40",
  lime: "from-lime-50 dark:from-lime-950/40",
  slate: "from-bg-soft dark:from-bg-soft",
};

const BLOB: Record<CategoryColor, string> = {
  emerald: "bg-emerald-400/25 dark:bg-emerald-500/15",
  green: "bg-green-400/25 dark:bg-green-500/15",
  teal: "bg-teal-400/25 dark:bg-teal-500/15",
  cyan: "bg-cyan-400/25 dark:bg-cyan-500/15",
  sky: "bg-sky-400/25 dark:bg-sky-500/15",
  blue: "bg-blue-400/25 dark:bg-blue-500/15",
  indigo: "bg-indigo-400/25 dark:bg-indigo-500/15",
  violet: "bg-violet-400/25 dark:bg-violet-500/15",
  fuchsia: "bg-fuchsia-400/25 dark:bg-fuchsia-500/15",
  pink: "bg-pink-400/25 dark:bg-pink-500/15",
  rose: "bg-rose-400/25 dark:bg-rose-500/15",
  orange: "bg-orange-400/25 dark:bg-orange-500/15",
  amber: "bg-amber-400/25 dark:bg-amber-500/15",
  lime: "bg-lime-400/25 dark:bg-lime-500/15",
  slate: "bg-surface-accent/20",
};

export const WIDGET_TEXT: Record<CategoryColor, string> = {
  emerald: "text-emerald-700 dark:text-emerald-300",
  green: "text-green-700 dark:text-green-300",
  teal: "text-teal-700 dark:text-teal-300",
  cyan: "text-cyan-700 dark:text-cyan-300",
  sky: "text-sky-700 dark:text-sky-300",
  blue: "text-blue-700 dark:text-blue-300",
  indigo: "text-indigo-700 dark:text-indigo-300",
  violet: "text-violet-700 dark:text-violet-300",
  fuchsia: "text-fuchsia-700 dark:text-fuchsia-300",
  pink: "text-pink-700 dark:text-pink-300",
  rose: "text-rose-700 dark:text-rose-300",
  orange: "text-orange-700 dark:text-orange-300",
  amber: "text-amber-700 dark:text-amber-300",
  lime: "text-lime-700 dark:text-lime-300",
  slate: "text-surface-foreground",
};

export const WIDGET_SOFT_BG: Record<CategoryColor, string> = {
  emerald: "bg-emerald-500/10",
  green: "bg-green-500/10",
  teal: "bg-teal-500/10",
  cyan: "bg-cyan-500/10",
  sky: "bg-sky-500/10",
  blue: "bg-blue-500/10",
  indigo: "bg-indigo-500/10",
  violet: "bg-violet-500/10",
  fuchsia: "bg-fuchsia-500/10",
  pink: "bg-pink-500/10",
  rose: "bg-rose-500/10",
  orange: "bg-orange-500/10",
  amber: "bg-amber-500/10",
  lime: "bg-lime-500/10",
  slate: "bg-surface-accent/10",
};

const BLOB_POS: Record<BlobPosition, string> = {
  "top-right": "-right-6 -top-8",
  "bottom-left": "-bottom-10 -left-8",
  "top-left": "-left-6 -top-8",
  "bottom-right": "-right-8 -bottom-10",
};

export default function WidgetCard({
  color = "slate",
  blob = "top-right",
  blobSize = "h-24 w-24",
  className = "",
  delayMs,
  children,
}: {
  color?: CategoryColor;
  blob?: BlobPosition | "none";
  blobSize?: string;
  className?: string;
  /** Staggers this card's entrance animation — pass the card's index * ~60ms
   * when rendering a list/grid of these, so they fade in one after another
   * instead of all at once. Omit for a card that isn't part of a stagger
   * (e.g. one that mounts on its own later, like a modal). */
  delayMs?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      data-widget-card
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined}
      className={`relative flex h-full flex-col overflow-hidden rounded-card border bg-gradient-to-br via-surface to-surface p-4 shadow-sm transition-[transform,box-shadow] duration-200 ${
        delayMs !== undefined ? "animate-[fade-in-up_0.4s_ease-out_backwards] motion-reduce:animate-none" : ""
      } sm:hover:-translate-y-0.5 sm:hover:shadow-md ${BORDER[color]} ${FROM[color]} ${className}`}
    >
      {blob !== "none" && (
        <div data-widget-blob className={`pointer-events-none absolute ${BLOB_POS[blob]} ${blobSize} rounded-full blur-2xl ${BLOB[color]}`} />
      )}
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
