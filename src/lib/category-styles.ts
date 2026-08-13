import type { CategoryColor } from "@/lib/categories";

export const CATEGORY_BADGE_CLASSES: Record<CategoryColor, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  green: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  pink: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  lime: "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  slate: "bg-[var(--nav-hover-bg)] text-ink-soft",
};

export const CATEGORY_DOT_CLASSES: Record<CategoryColor, string> = {
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
  slate: "bg-neutral-400",
};

const FALLBACK_BADGE = "bg-[var(--nav-hover-bg)] text-ink-soft";
const FALLBACK_DOT = "bg-neutral-400";

export function badgeClasses(color: string | undefined): string {
  if (!color) return FALLBACK_BADGE;
  return CATEGORY_BADGE_CLASSES[color as CategoryColor] ?? FALLBACK_BADGE;
}

export function dotClasses(color: string | undefined): string {
  if (!color) return FALLBACK_DOT;
  return CATEGORY_DOT_CLASSES[color as CategoryColor] ?? FALLBACK_DOT;
}

// Same palette, used to let a Dashboard widget's headline number/bars/bars
// take on a chosen accent instead of the neutral default — same color
// tokens as categories/wallets so it always matches the app's theme.
export const CATEGORY_ACCENT_TEXT_CLASSES: Record<CategoryColor, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  green: "text-green-600 dark:text-green-400",
  teal: "text-teal-600 dark:text-teal-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  sky: "text-sky-600 dark:text-sky-400",
  blue: "text-blue-600 dark:text-blue-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  violet: "text-violet-600 dark:text-violet-400",
  fuchsia: "text-fuchsia-600 dark:text-fuchsia-400",
  pink: "text-pink-600 dark:text-pink-400",
  rose: "text-rose-600 dark:text-rose-400",
  orange: "text-orange-600 dark:text-orange-400",
  amber: "text-amber-600 dark:text-amber-400",
  lime: "text-lime-600 dark:text-lime-400",
  slate: "text-surface-foreground",
};

export function accentTextClasses(color: string | undefined): string {
  if (!color) return "text-surface-foreground";
  return CATEGORY_ACCENT_TEXT_CLASSES[color as CategoryColor] ?? "text-surface-foreground";
}

export function accentBgClasses(color: string | undefined): string {
  if (!color) return "bg-surface-accent";
  return CATEGORY_DOT_CLASSES[color as CategoryColor] ?? "bg-surface-accent";
}

// A two-stop diagonal gradient per accent, for the small set of "hero" pill/
// solid-color widgets (WeekdayTrackerWidget, CornerArrowStatWidget) that
// want a richer saturated card instead of the pastel gradient-glow cards
// everywhere else — same palette, just a bolder full-bleed treatment.
export const CATEGORY_HERO_GRADIENT_CLASSES: Record<CategoryColor, string> = {
  emerald: "bg-gradient-to-br from-emerald-400 to-emerald-600",
  green: "bg-gradient-to-br from-green-400 to-green-600",
  teal: "bg-gradient-to-br from-teal-400 to-teal-600",
  cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600",
  sky: "bg-gradient-to-br from-sky-400 to-sky-600",
  blue: "bg-gradient-to-br from-blue-400 to-blue-600",
  indigo: "bg-gradient-to-br from-indigo-400 to-indigo-600",
  violet: "bg-gradient-to-br from-violet-400 to-violet-600",
  fuchsia: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600",
  pink: "bg-gradient-to-br from-pink-400 to-pink-600",
  rose: "bg-gradient-to-br from-rose-400 to-rose-600",
  orange: "bg-gradient-to-br from-orange-400 to-orange-600",
  amber: "bg-gradient-to-br from-amber-400 to-amber-600",
  lime: "bg-gradient-to-br from-lime-400 to-lime-600",
  slate: "bg-gradient-to-br from-surface-accent to-surface-accent-dark",
};

export function heroGradientClasses(color: string | undefined): string {
  if (!color) return "bg-gradient-to-br from-rose-400 to-rose-600";
  return CATEGORY_HERO_GRADIENT_CLASSES[color as CategoryColor] ?? "bg-gradient-to-br from-rose-400 to-rose-600";
}
