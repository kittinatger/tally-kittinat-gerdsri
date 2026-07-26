import type { Category } from "@/lib/categories";

export const CATEGORY_STYLES: Record<Category, string> = {
  // Expense categories
  Groceries: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Food & Drink": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Transport: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Shopping: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Bills & Utilities": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Entertainment: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  Health: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  Travel: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  // Income categories
  Salary: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Freelance: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Business: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Investment: "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  Gift: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Refund: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  // Shared
  Other: "bg-[var(--nav-hover-bg)] text-ink-soft",
};

const FALLBACK_STYLE = "bg-[var(--nav-hover-bg)] text-ink-soft";

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category as Category] ?? FALLBACK_STYLE;
}
