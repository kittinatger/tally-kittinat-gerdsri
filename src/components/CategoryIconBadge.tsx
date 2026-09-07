"use client";

import { badgeClasses, colorDotStyle } from "@/lib/category-styles";

// The small colored icon circle in front of a list row's name — the same
// `h-9 w-9 rounded-full` + badgeClasses(color) shape already correct in
// ExpenseRow's compact mode, RecurringManager, and BudgetManager, but
// hand-rolled again (with a fixed color, no per-item customization needed)
// in SplitBillManager and ChallengesManager's row headers.
export default function CategoryIconBadge({
  icon,
  color,
}: {
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(color)}`}
      style={colorDotStyle(color)}
    >
      {icon}
    </span>
  );
}
