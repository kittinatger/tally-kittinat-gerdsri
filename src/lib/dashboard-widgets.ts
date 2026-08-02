export const DASHBOARD_WIDGET_TYPES = ["summary", "categoryOverview", "wallets", "recentTransactions"] as const;
export type DashboardWidgetType = (typeof DASHBOARD_WIDGET_TYPES)[number];

export function isDashboardWidgetType(value: string): value is DashboardWidgetType {
  return (DASHBOARD_WIDGET_TYPES as readonly string[]).includes(value);
}

export const WIDGET_WIDTHS = ["full", "half"] as const;
export type WidgetWidth = (typeof WIDGET_WIDTHS)[number];

export function isWidgetWidth(value: string): value is WidgetWidth {
  return (WIDGET_WIDTHS as readonly string[]).includes(value);
}

// Which cards the "summary" widget shows — the only widget with per-instance
// configuration so far. Kept as a plain optional field on the instance
// rather than a nested per-type config object, since there's only one.
export const SUMMARY_CARDS = ["income", "expenses", "remaining"] as const;
export type SummaryCardId = (typeof SUMMARY_CARDS)[number];

export function isSummaryCardId(value: string): value is SummaryCardId {
  return (SUMMARY_CARDS as readonly string[]).includes(value);
}

export const SUMMARY_CARD_LABELS: Record<SummaryCardId, string> = {
  income: "Income",
  expenses: "Expenses",
  remaining: "Remaining",
};

// A single tile on the Dashboard — its own id (so the same widget type can
// appear more than once, e.g. two category charts side by side), which
// widget it renders, how much of the grid row it takes up, and (for widgets
// that support it) which of their internal sections to show.
export type DashboardWidgetInstance = {
  id: string;
  type: DashboardWidgetType;
  width: WidgetWidth;
  /** Only meaningful when type is "summary". Undefined means "show all". */
  cards?: SummaryCardId[];
};

export const DASHBOARD_WIDGET_INFO: Record<DashboardWidgetType, { title: string; description: string }> = {
  summary: { title: "Summary cards", description: "This month's income, expenses, and your remaining balance" },
  categoryOverview: { title: "Category breakdown", description: "Spending trend chart and category totals" },
  wallets: { title: "Wallets", description: "Each wallet's balance at a glance" },
  recentTransactions: { title: "Recent transactions", description: "Your latest 5 transactions" },
};

function makeId(type: DashboardWidgetType): string {
  return `${type}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DEFAULT_DASHBOARD_WIDGETS(): DashboardWidgetInstance[] {
  return [
    { id: makeId("summary"), type: "summary", width: "full", cards: [...SUMMARY_CARDS] },
    { id: makeId("categoryOverview"), type: "categoryOverview", width: "full" },
    { id: makeId("wallets"), type: "wallets", width: "half" },
    { id: makeId("recentTransactions"), type: "recentTransactions", width: "half" },
  ];
}

export function newWidgetInstance(type: DashboardWidgetType): DashboardWidgetInstance {
  return { id: makeId(type), type, width: "full", cards: type === "summary" ? [...SUMMARY_CARDS] : undefined };
}

// Tolerates malformed/outdated stored JSON: drops entries that don't look
// like a valid instance, and falls back to the full default layout only if
// nothing at all survives (an empty array is a valid, intentional "cleared
// my dashboard" state and is left as-is).
export function normalizeDashboardWidgets(raw: unknown): DashboardWidgetInstance[] {
  if (!Array.isArray(raw)) return DEFAULT_DASHBOARD_WIDGETS();
  const seen = new Set<string>();
  const result: DashboardWidgetInstance[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "string" &&
      typeof (item as { type?: unknown }).type === "string" &&
      isDashboardWidgetType((item as { type: string }).type)
    ) {
      const id = (item as { id: string }).id;
      if (seen.has(id)) continue;
      seen.add(id);
      const type = (item as { type: DashboardWidgetType }).type;
      const rawWidth = (item as { width?: unknown }).width;
      const width = typeof rawWidth === "string" && isWidgetWidth(rawWidth) ? rawWidth : "full";
      const rawCards = (item as { cards?: unknown }).cards;
      const cards =
        type === "summary"
          ? Array.isArray(rawCards)
            ? rawCards.filter((c): c is SummaryCardId => typeof c === "string" && isSummaryCardId(c))
            : [...SUMMARY_CARDS]
          : undefined;
      result.push({ id, type, width, cards: cards && cards.length > 0 ? cards : type === "summary" ? [...SUMMARY_CARDS] : undefined });
    }
  }
  if (result.length === 0 && raw.length === 0) return [];
  if (result.length === 0) return DEFAULT_DASHBOARD_WIDGETS();
  return result;
}
