// Shared between SettingsView.tsx (renders these as in-app panels),
// SettingsNavList.tsx (the persistent nav list reused on Settings itself
// and the standalone Support pages), and settings/page.tsx (validates the
// `?panel=` query string used to deep-link into one from those standalone
// pages, since they don't have panel state of their own).
export const PANEL_VALUES = [
  "account",
  "permissions",
  "categories",
  "tags",
  "wallets",
  "friends",
  "challenges",
  "splitBills",
  "loans",
  "assistant",
  "currency",
  "language",
  "calendar",
  "dashboardWidgets",
  "recurring",
  "budgets",
  "savingsGoals",
  "autoImport",
  "errorReports",
  "backup",
  "appLock",
  "pendingChanges",
  "templateReviews",
  "codeGenerator",
] as const;

export type Panel = (typeof PANEL_VALUES)[number];

export function isPanel(value: string): value is Panel {
  return (PANEL_VALUES as readonly string[]).includes(value);
}
