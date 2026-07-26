import type { Category } from "@/lib/categories";

export const CATEGORY_STYLES: Record<Category, string> = {
  Groceries: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Food & Drink": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Transport: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Shopping: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Bills & Utilities": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Entertainment: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  Health: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  Travel: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  Other: "bg-[var(--nav-hover-bg)] text-ink-soft",
};

const FALLBACK_STYLE = "bg-[var(--nav-hover-bg)] text-ink-soft";

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category as Category] ?? FALLBACK_STYLE;
}
