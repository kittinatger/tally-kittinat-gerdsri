export const DASHBOARD_WIDGET_TYPES = [
  "summary",
  "categoryOverview",
  "wallets",
  "recentTransactions",
  "todaySpending",
  "weekSpending",
  "yearSpending",
  "avgDailySpending",
  "avgTransactionAmount",
  "transactionCount",
  "biggestExpense",
  "topCategory",
  "topMerchant",
  "savingsRate",
  "netWorth",
  "monthComparison",
  "transfersTotal",
  "topIncomeSource",
  "last7Days",
  "last30Days",
  "topCategories",
  "walletDistribution",
  "topTags",
  "quickStats",
  "expensesByWallet",
  "yearToDateIncome",
  "largestWallet",
] as const;
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

// Reuses the same 15-color palette categories/wallets already use (see
// lib/categories.ts CATEGORY_PALETTE) so an accented widget always matches
// the app's existing theme rather than introducing new colors.
export const WIDGET_ACCENTS = [
  "emerald",
  "green",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "pink",
  "rose",
  "orange",
  "amber",
  "lime",
  "slate",
] as const;
export type WidgetAccent = (typeof WIDGET_ACCENTS)[number];

export function isWidgetAccent(value: string): value is WidgetAccent {
  return (WIDGET_ACCENTS as readonly string[]).includes(value);
}

export const LIMIT_OPTIONS = [3, 5, 10, 15, 20] as const;

// Widgets whose headline number/bars can take a chosen accent color instead
// of the neutral default (excludes ones with their own multi-color content —
// category chips, wallet dots — or meaningful semantic red/green coloring).
export const ACCENT_CAPABLE_TYPES: readonly DashboardWidgetType[] = [
  "todaySpending",
  "weekSpending",
  "yearSpending",
  "avgDailySpending",
  "avgTransactionAmount",
  "transactionCount",
  "biggestExpense",
  "topCategory",
  "topMerchant",
  "netWorth",
  "transfersTotal",
  "topIncomeSource",
  "last7Days",
  "last30Days",
  "quickStats",
  "largestWallet",
  "topCategories",
  "walletDistribution",
  "topTags",
  "expensesByWallet",
];

// Widgets with a "how many to show" list length.
export const LIMIT_CAPABLE_TYPES: readonly DashboardWidgetType[] = ["recentTransactions", "topCategories", "topTags"];

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
  /** Only meaningful for ACCENT_CAPABLE_TYPES. Undefined means the widget's neutral default. */
  accent?: WidgetAccent;
  /** Only meaningful for LIMIT_CAPABLE_TYPES. Undefined means that widget's own default. */
  limit?: number;
};

export const DASHBOARD_WIDGET_INFO: Record<DashboardWidgetType, { title: string; description: string }> = {
  summary: { title: "Summary cards", description: "This month's income, expenses, and your remaining balance" },
  categoryOverview: { title: "Category breakdown", description: "Spending trend chart and category totals" },
  wallets: { title: "Wallets", description: "Each wallet's balance at a glance" },
  recentTransactions: { title: "Recent transactions", description: "Your latest 5 transactions" },
  todaySpending: { title: "Today's spending", description: "Total spent so far today" },
  weekSpending: { title: "This week's spending", description: "Total spent since the start of the week" },
  yearSpending: { title: "This year's spending", description: "Total spent so far this year" },
  avgDailySpending: { title: "Average daily spending", description: "This month's spending divided by days elapsed" },
  avgTransactionAmount: { title: "Average transaction", description: "Average expense amount this month" },
  transactionCount: { title: "Transaction count", description: "Number of transactions logged this month" },
  biggestExpense: { title: "Biggest expense", description: "Your largest single expense this month" },
  topCategory: { title: "Top category", description: "Highest-spending category this month" },
  topMerchant: { title: "Top merchant", description: "Merchant you've spent the most with this month" },
  savingsRate: { title: "Savings rate", description: "Share of this month's income you kept" },
  netWorth: { title: "Net worth", description: "Combined balance across every wallet" },
  monthComparison: { title: "Month vs last month", description: "How this month's spending compares to last month's" },
  transfersTotal: { title: "Transfers total", description: "Total moved via transfers this month" },
  topIncomeSource: { title: "Top income source", description: "Highest-earning income category this month" },
  last7Days: { title: "Last 7 days", description: "Daily spending for the past week" },
  last30Days: { title: "Last 30 days", description: "Daily spending for the past month" },
  topCategories: { title: "Top categories", description: "Your top 5 spending categories this month" },
  walletDistribution: { title: "Wallet distribution", description: "Balance breakdown across your wallets" },
  topTags: { title: "Top tags", description: "Your 5 most-used tags" },
  quickStats: { title: "Quick stats", description: "Income, expenses, transaction count, and average at a glance" },
  expensesByWallet: { title: "Spending by wallet", description: "This month's spending broken down by wallet" },
  yearToDateIncome: { title: "Year-to-date income", description: "Total income so far this year" },
  largestWallet: { title: "Largest wallet", description: "Your wallet with the highest balance" },
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
      const rawAccent = (item as { accent?: unknown }).accent;
      const accent =
        ACCENT_CAPABLE_TYPES.includes(type) && typeof rawAccent === "string" && isWidgetAccent(rawAccent)
          ? rawAccent
          : undefined;
      const rawLimit = (item as { limit?: unknown }).limit;
      const limit =
        LIMIT_CAPABLE_TYPES.includes(type) && typeof rawLimit === "number" && (LIMIT_OPTIONS as readonly number[]).includes(rawLimit)
          ? rawLimit
          : undefined;
      result.push({
        id,
        type,
        width,
        cards: cards && cards.length > 0 ? cards : type === "summary" ? [...SUMMARY_CARDS] : undefined,
        accent,
        limit,
      });
    }
  }
  if (result.length === 0 && raw.length === 0) return [];
  if (result.length === 0) return DEFAULT_DASHBOARD_WIDGETS();
  return result;
}
