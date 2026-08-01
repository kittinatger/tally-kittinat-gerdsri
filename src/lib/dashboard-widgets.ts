export const DASHBOARD_WIDGET_IDS = ["summary", "categoryOverview", "wallets", "recentTransactions"] as const;
export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value);
}

export type DashboardWidgetConfig = { id: DashboardWidgetId; visible: boolean };

export const DASHBOARD_WIDGET_INFO: Record<DashboardWidgetId, { title: string; description: string }> = {
  summary: { title: "Summary cards", description: "This month's income, expenses, and your remaining balance" },
  categoryOverview: { title: "Category breakdown", description: "Spending trend chart and category totals" },
  wallets: { title: "Wallets", description: "Each wallet's balance at a glance" },
  recentTransactions: { title: "Recent transactions", description: "Your latest 5 transactions" },
};

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = DASHBOARD_WIDGET_IDS.map((id) => ({
  id,
  visible: true,
}));

// Tolerates unknown/missing/malformed input: drops ids that no longer
// exist, appends any newly-added widget ids (visible by default) so a
// stored config from an older version doesn't silently lose new widgets,
// and falls back to the full default set if parsing fails entirely.
export function normalizeDashboardWidgets(raw: unknown): DashboardWidgetConfig[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<DashboardWidgetId>();
  const result: DashboardWidgetConfig[] = [];
  for (const item of list) {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      typeof (item as { id: unknown }).id === "string" &&
      isDashboardWidgetId((item as { id: string }).id) &&
      !seen.has((item as { id: DashboardWidgetId }).id)
    ) {
      const id = (item as { id: DashboardWidgetId }).id;
      const visible = "visible" in item ? Boolean((item as { visible: unknown }).visible) : true;
      seen.add(id);
      result.push({ id, visible });
    }
  }
  for (const id of DASHBOARD_WIDGET_IDS) {
    if (!seen.has(id)) result.push({ id, visible: true });
  }
  return result;
}
