import type { Category } from "@/lib/categories";

export const CATEGORY_STYLES: Record<Category, string> = {
  Groceries: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Food & Drink": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Transport: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Shopping: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Bills & Utilities": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  Health: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  Travel: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  Other: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
};

const FALLBACK_STYLE = "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category as Category] ?? FALLBACK_STYLE;
}
