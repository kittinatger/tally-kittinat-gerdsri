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

export const WIDGET_TEXT_SOFT: Record<CategoryColor, string> = {
  emerald: "text-emerald-700/70 dark:text-emerald-300/70",
  green: "text-green-700/70 dark:text-green-300/70",
  teal: "text-teal-700/70 dark:text-teal-300/70",
  cyan: "text-cyan-700/70 dark:text-cyan-300/70",
  sky: "text-sky-700/70 dark:text-sky-300/70",
  blue: "text-blue-700/70 dark:text-blue-300/70",
  indigo: "text-indigo-700/70 dark:text-indigo-300/70",
  violet: "text-violet-700/70 dark:text-violet-300/70",
  fuchsia: "text-fuchsia-700/70 dark:text-fuchsia-300/70",
  pink: "text-pink-700/70 dark:text-pink-300/70",
  rose: "text-rose-700/70 dark:text-rose-300/70",
  orange: "text-orange-700/70 dark:text-orange-300/70",
  amber: "text-amber-700/70 dark:text-amber-300/70",
  lime: "text-lime-700/70 dark:text-lime-300/70",
  slate: "text-surface-foreground-soft",
};

export const WIDGET_SOLID: Record<CategoryColor, string> = {
  emerald: "bg-emerald-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  slate: "bg-surface-accent",
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

export const WIDGET_GRADIENT_TEXT: Record<CategoryColor, string> = {
  emerald: "from-emerald-600 to-teal-500 dark:from-emerald-300 dark:to-teal-300",
  green: "from-green-600 to-emerald-500 dark:from-green-300 dark:to-emerald-300",
  teal: "from-teal-600 to-cyan-500 dark:from-teal-300 dark:to-cyan-300",
  cyan: "from-cyan-600 to-sky-500 dark:from-cyan-300 dark:to-sky-300",
  sky: "from-sky-600 to-blue-500 dark:from-sky-300 dark:to-blue-300",
  blue: "from-blue-600 to-indigo-500 dark:from-blue-300 dark:to-indigo-300",
  indigo: "from-indigo-600 to-violet-500 dark:from-indigo-300 dark:to-violet-300",
  violet: "from-violet-600 to-fuchsia-500 dark:from-violet-300 dark:to-fuchsia-300",
  fuchsia: "from-fuchsia-600 to-pink-500 dark:from-fuchsia-300 dark:to-pink-300",
  pink: "from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-300",
  rose: "from-rose-600 to-orange-500 dark:from-rose-300 dark:to-orange-300",
  orange: "from-orange-600 to-amber-500 dark:from-orange-300 dark:to-amber-300",
  amber: "from-amber-600 to-orange-500 dark:from-amber-300 dark:to-orange-300",
  lime: "from-lime-600 to-green-500 dark:from-lime-300 dark:to-green-300",
  slate: "from-surface-foreground to-surface-foreground-soft",
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
  children,
}: {
  color?: CategoryColor;
  blob?: BlobPosition | "none";
  blobSize?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-card border bg-gradient-to-br via-surface to-surface p-4 shadow-sm ${BORDER[color]} ${FROM[color]} ${className}`}
    >
      {blob !== "none" && (
        <div className={`pointer-events-none absolute ${BLOB_POS[blob]} ${blobSize} rounded-full blur-2xl ${BLOB[color]}`} />
      )}
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
