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
