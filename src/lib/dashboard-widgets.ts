import type { MessageKey } from "@/lib/i18n/messages";

// Four core, richly-interactive building blocks (own add-transaction
// buttons, its own chart-type controls, etc.) plus 50 small single-purpose
// visual widgets — see DASHBOARD_WIDGET_INFO_KEYS for the full catalog and
// DashboardWidgetContent.tsx for what each one actually renders.
export const DASHBOARD_WIDGET_TYPES = [
  "welcome",
  "summary",
  "categoryOverview",
  "wallets",
  "recentTransactions",
  // Summary cards, split into individual clickable widgets
  "incomeCard",
  "expensesCard",
  "remainingCard",
  // Big numbers
  "todaySpending",
  "yesterdaySpending",
  "weekSpending",
  "monthSpending",
  "yearSpending",
  "todayIncome",
  "monthIncome",
  "yearIncome",
  "netWorth",
  "totalBalance",
  "avgDailySpending",
  "avgTransactionAmount",
  "avgIncomeAmount",
  "biggestExpense",
  "biggestIncome",
  "transactionCount",
  "transfersTotal",
  "walletCount",
  "categoryCount",
  "tagCount",
  // Trend arrows
  "monthComparison",
  "incomeComparison",
  "weekComparison",
  "yearOverYear",
  // Rings & gauges
  "savingsRate",
  "monthProgress",
  "yearProgress",
  "spendPace",
  "walletUsage",
  // Sparklines
  "last14DaysSpark",
  "last14DaysIncomeSpark",
  "last6MonthsSpark",
  // Donuts
  "categoryDonut",
  "typeDonut",
  "walletDonut",
  // Heatmaps
  "last30DaysHeatmap",
  "last90DaysHeatmap",
  // Stacked bars
  "walletShareBar",
  "categoryShareBar",
  // Comparison bars
  "incomeVsExpenseBars",
  "cashVsDigitalBars",
  // Ranked bar lists
  "topCategories",
  "topMerchants",
  "topTags",
  "topIncomeSources",
  "walletDistribution",
  "expensesByWallet",
  // Leaderboards
  "topMerchantsLeaderboard",
  "topCategoriesLeaderboard",
  // Bar chart
  "last7Days",
  // Creative widgets
  "netWorthTicker",
  "walletTicker",
  "todayPill",
  "pacePill",
  "noSpendDays",
  "balanceHero",
  "payPeriodStepper",
  "spendingStreak",
  // Budgets & goals
  "budgetOverview",
  "savingsGoals",
] as const;
export type DashboardWidgetType = (typeof DASHBOARD_WIDGET_TYPES)[number];

export function isDashboardWidgetType(value: string): value is DashboardWidgetType {
  return (DASHBOARD_WIDGET_TYPES as readonly string[]).includes(value);
}

// Three sizes on a grid that's 2 columns on mobile and 4 from sm: up (see
// callers — grid-cols-2 sm:grid-cols-4) — small is a half row on mobile /
// quarter row on desktop, medium is a full row on mobile / half row on
// desktop, large is always the full row. Not every widget supports every
// size (see SUPPORTED_WIDTHS): a 3-card summary or a wide chart genuinely
// breaks at quarter width, so those simply never offer "small" as an option.
export const WIDGET_WIDTHS = ["small", "medium", "large"] as const;
export type WidgetWidth = (typeof WIDGET_WIDTHS)[number];

export function isWidgetWidth(value: string): value is WidgetWidth {
  return (WIDGET_WIDTHS as readonly string[]).includes(value);
}

export const WIDGET_WIDTH_LABEL_KEYS: Record<WidgetWidth, MessageKey> = {
  small: "widgetWidth.small",
  medium: "widgetWidth.medium",
  large: "widgetWidth.large",
};

// "large" must stay full-width at both column counts — a flat "col-span-4"
// would force the browser to add implicit extra columns on the 2-column
// mobile grid instead of just spanning it, breaking the mobile layout.
export const WIDGET_WIDTH_COLSPAN: Record<WidgetWidth, string> = {
  small: "col-span-1",
  medium: "col-span-2",
  large: "col-span-2 sm:col-span-4",
};

// Legacy values from before sizes were split into three — mapped forward so
// existing saved layouts keep working.
const LEGACY_WIDTH_MAP: Record<string, WidgetWidth> = { full: "large", half: "medium" };

// Which cards the "summary" widget shows — the only widget with per-instance
// configuration so far. Kept as a plain optional field on the instance
// rather than a nested per-type config object, since there's only one.
export const SUMMARY_CARDS = ["income", "expenses", "remaining"] as const;
export type SummaryCardId = (typeof SUMMARY_CARDS)[number];

export function isSummaryCardId(value: string): value is SummaryCardId {
  return (SUMMARY_CARDS as readonly string[]).includes(value);
}

export const SUMMARY_CARD_LABEL_KEYS: Record<SummaryCardId, MessageKey> = {
  income: "summaryCard.income",
  expenses: "summaryCard.expenses",
  remaining: "summaryCard.remaining",
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

// Widgets whose headline number/line/ring/bars can take a chosen accent
// color instead of the neutral default (excludes ones with their own
// inherently multi-color content — donuts, stacked bars, leaderboards — or
// meaningful semantic red/green coloring — trend arrows, income/expense
// comparisons).
export const ACCENT_CAPABLE_TYPES: readonly DashboardWidgetType[] = [
  "transactionCount",
  "transfersTotal",
  "walletCount",
  "categoryCount",
  "tagCount",
  "savingsRate",
  "monthProgress",
  "yearProgress",
  "spendPace",
  "walletUsage",
  "last30DaysHeatmap",
  "last90DaysHeatmap",
  "last7Days",
  "netWorthTicker",
  "walletTicker",
  "todayPill",
  "noSpendDays",
  "payPeriodStepper",
  "spendingStreak",
];

// Widgets with a "how many to show" list length.
export const LIMIT_CAPABLE_TYPES: readonly DashboardWidgetType[] = [
  "recentTransactions",
  "topCategories",
  "topMerchants",
  "topTags",
  "topIncomeSources",
  "topMerchantsLeaderboard",
  "topCategoriesLeaderboard",
];

// Widgets with a bottom quick-action button (Add income/expense, Edit
// balance) that can be hidden to make the card display-only.
export const ACTION_HIDABLE_TYPES: readonly DashboardWidgetType[] = [
  "summary",
  "incomeCard",
  "expensesCard",
  "remainingCard",
  "welcome",
];

// Widgets that can be scoped to a single wallet instead of the combined
// total across all wallets. Undefined/null on the instance means "all
// wallets".
export const WALLET_CAPABLE_TYPES: readonly DashboardWidgetType[] = ["welcome"];

// Which sizes each widget type can actually be displayed at, ordered
// smallest first. Single-number/ring/gauge widgets look fine as a
// quarter-row tile; anything with a chart, multi-item list, or SummaryCards'
// own internal 1-3 column grid gets cramped or unreadable at "small" and
// simply doesn't offer it.
export const SUPPORTED_WIDTHS: Record<DashboardWidgetType, readonly WidgetWidth[]> = {
  summary: ["medium", "large"],
  categoryOverview: ["medium", "large"],
  wallets: ["medium", "large"],
  recentTransactions: ["medium", "large"],
  incomeCard: ["small", "medium", "large"],
  expensesCard: ["small", "medium", "large"],
  remainingCard: ["small", "medium", "large"],
  todaySpending: ["small", "medium", "large"],
  yesterdaySpending: ["small", "medium", "large"],
  weekSpending: ["small", "medium", "large"],
  monthSpending: ["small", "medium", "large"],
  yearSpending: ["small", "medium", "large"],
  todayIncome: ["small", "medium", "large"],
  monthIncome: ["small", "medium", "large"],
  yearIncome: ["small", "medium", "large"],
  netWorth: ["small", "medium", "large"],
  totalBalance: ["small", "medium", "large"],
  avgDailySpending: ["small", "medium", "large"],
  avgTransactionAmount: ["small", "medium", "large"],
  avgIncomeAmount: ["small", "medium", "large"],
  biggestExpense: ["small", "medium", "large"],
  biggestIncome: ["small", "medium", "large"],
  transactionCount: ["small", "medium", "large"],
  transfersTotal: ["small", "medium", "large"],
  walletCount: ["small", "medium", "large"],
  categoryCount: ["small", "medium", "large"],
  tagCount: ["small", "medium", "large"],
  monthComparison: ["small", "medium", "large"],
  incomeComparison: ["small", "medium", "large"],
  weekComparison: ["small", "medium", "large"],
  yearOverYear: ["small", "medium", "large"],
  savingsRate: ["small", "medium", "large"],
  monthProgress: ["small", "medium", "large"],
  yearProgress: ["small", "medium", "large"],
  spendPace: ["small", "medium", "large"],
  walletUsage: ["small", "medium", "large"],
  last14DaysSpark: ["small", "medium", "large"],
  last14DaysIncomeSpark: ["small", "medium", "large"],
  last6MonthsSpark: ["small", "medium", "large"],
  categoryDonut: ["medium", "large"],
  typeDonut: ["medium", "large"],
  walletDonut: ["medium", "large"],
  last30DaysHeatmap: ["medium", "large"],
  last90DaysHeatmap: ["medium", "large"],
  walletShareBar: ["medium", "large"],
  categoryShareBar: ["medium", "large"],
  incomeVsExpenseBars: ["medium", "large"],
  cashVsDigitalBars: ["medium", "large"],
  topCategories: ["medium", "large"],
  topMerchants: ["medium", "large"],
  topTags: ["medium", "large"],
  topIncomeSources: ["medium", "large"],
  walletDistribution: ["medium", "large"],
  expensesByWallet: ["medium", "large"],
  topMerchantsLeaderboard: ["medium", "large"],
  topCategoriesLeaderboard: ["medium", "large"],
  last7Days: ["medium", "large"],
  netWorthTicker: ["medium", "large"],
  walletTicker: ["medium", "large"],
  todayPill: ["medium", "large"],
  pacePill: ["medium", "large"],
  noSpendDays: ["small", "medium", "large"],
  balanceHero: ["large"],
  welcome: ["large"],
  payPeriodStepper: ["medium", "large"],
  spendingStreak: ["small", "medium", "large"],
  budgetOverview: ["medium", "large"],
  savingsGoals: ["medium", "large"],
};

export function defaultWidthForType(type: DashboardWidgetType): WidgetWidth {
  const supported = SUPPORTED_WIDTHS[type];
  return supported.includes("medium") ? "medium" : supported[0];
}

export function clampWidthForType(type: DashboardWidgetType, width: WidgetWidth): WidgetWidth {
  const supported = SUPPORTED_WIDTHS[type];
  return supported.includes(width) ? width : defaultWidthForType(type);
}

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
  /** Only meaningful for ACTION_HIDABLE_TYPES. True hides the bottom quick-action button, making the card display-only. */
  hideAction?: boolean;
  /** Only meaningful for WALLET_CAPABLE_TYPES. Undefined/null means "all wallets combined". */
  walletId?: number | null;
};

export const DASHBOARD_WIDGET_INFO_KEYS: Record<DashboardWidgetType, { titleKey: MessageKey; descKey: MessageKey }> = {
  summary: { titleKey: "widget.summaryTitle", descKey: "widget.summaryDesc" },
  categoryOverview: { titleKey: "widget.categoryOverviewTitle", descKey: "widget.categoryOverviewDesc" },
  wallets: { titleKey: "widget.walletsTitle", descKey: "widget.walletsDesc" },
  recentTransactions: { titleKey: "widget.recentTransactionsTitle", descKey: "widget.recentTransactionsDesc" },
  incomeCard: { titleKey: "widget.incomeCardTitle", descKey: "widget.incomeCardDesc" },
  expensesCard: { titleKey: "widget.expensesCardTitle", descKey: "widget.expensesCardDesc" },
  remainingCard: { titleKey: "widget.remainingCardTitle", descKey: "widget.remainingCardDesc" },

  todaySpending: { titleKey: "widget.todaySpendingTitle", descKey: "widget.todaySpendingDesc" },
  yesterdaySpending: { titleKey: "widget.yesterdaySpendingTitle", descKey: "widget.yesterdaySpendingDesc" },
  weekSpending: { titleKey: "widget.weekSpendingTitle", descKey: "widget.weekSpendingDesc" },
  monthSpending: { titleKey: "widget.monthSpendingTitle", descKey: "widget.monthSpendingDesc" },
  yearSpending: { titleKey: "widget.yearSpendingTitle", descKey: "widget.yearSpendingDesc" },
  todayIncome: { titleKey: "widget.todayIncomeTitle", descKey: "widget.todayIncomeDesc" },
  monthIncome: { titleKey: "widget.monthIncomeTitle", descKey: "widget.monthIncomeDesc" },
  yearIncome: { titleKey: "widget.yearIncomeTitle", descKey: "widget.yearIncomeDesc" },
  netWorth: { titleKey: "widget.netWorthTitle", descKey: "widget.netWorthDesc" },
  totalBalance: { titleKey: "widget.totalBalanceTitle", descKey: "widget.totalBalanceDesc" },
  avgDailySpending: { titleKey: "widget.avgDailySpendingTitle", descKey: "widget.avgDailySpendingDesc" },
  avgTransactionAmount: { titleKey: "widget.avgTransactionAmountTitle", descKey: "widget.avgTransactionAmountDesc" },
  avgIncomeAmount: { titleKey: "widget.avgIncomeAmountTitle", descKey: "widget.avgIncomeAmountDesc" },
  biggestExpense: { titleKey: "widget.biggestExpenseTitle", descKey: "widget.biggestExpenseDesc" },
  biggestIncome: { titleKey: "widget.biggestIncomeTitle", descKey: "widget.biggestIncomeDesc" },
  transactionCount: { titleKey: "widget.transactionCountTitle", descKey: "widget.transactionCountDesc" },
  transfersTotal: { titleKey: "widget.transfersTotalTitle", descKey: "widget.transfersTotalDesc" },
  walletCount: { titleKey: "widget.walletCountTitle", descKey: "widget.walletCountDesc" },
  categoryCount: { titleKey: "widget.categoryCountTitle", descKey: "widget.categoryCountDesc" },
  tagCount: { titleKey: "widget.tagCountTitle", descKey: "widget.tagCountDesc" },

  monthComparison: { titleKey: "widget.monthComparisonTitle", descKey: "widget.monthComparisonDesc" },
  incomeComparison: { titleKey: "widget.incomeComparisonTitle", descKey: "widget.incomeComparisonDesc" },
  weekComparison: { titleKey: "widget.weekComparisonTitle", descKey: "widget.weekComparisonDesc" },
  yearOverYear: { titleKey: "widget.yearOverYearTitle", descKey: "widget.yearOverYearDesc" },

  savingsRate: { titleKey: "widget.savingsRateTitle", descKey: "widget.savingsRateDesc" },
  monthProgress: { titleKey: "widget.monthProgressTitle", descKey: "widget.monthProgressDesc" },
  yearProgress: { titleKey: "widget.yearProgressTitle", descKey: "widget.yearProgressDesc" },
  spendPace: { titleKey: "widget.spendPaceTitle", descKey: "widget.spendPaceDesc" },
  walletUsage: { titleKey: "widget.walletUsageTitle", descKey: "widget.walletUsageDesc" },

  last14DaysSpark: { titleKey: "widget.last14DaysSparkTitle", descKey: "widget.last14DaysSparkDesc" },
  last14DaysIncomeSpark: { titleKey: "widget.last14DaysIncomeSparkTitle", descKey: "widget.last14DaysIncomeSparkDesc" },
  last6MonthsSpark: { titleKey: "widget.last6MonthsSparkTitle", descKey: "widget.last6MonthsSparkDesc" },

  categoryDonut: { titleKey: "widget.categoryDonutTitle", descKey: "widget.categoryDonutDesc" },
  typeDonut: { titleKey: "widget.typeDonutTitle", descKey: "widget.typeDonutDesc" },
  walletDonut: { titleKey: "widget.walletDonutTitle", descKey: "widget.walletDonutDesc" },

  last30DaysHeatmap: { titleKey: "widget.last30DaysHeatmapTitle", descKey: "widget.last30DaysHeatmapDesc" },
  last90DaysHeatmap: { titleKey: "widget.last90DaysHeatmapTitle", descKey: "widget.last90DaysHeatmapDesc" },

  walletShareBar: { titleKey: "widget.walletShareBarTitle", descKey: "widget.walletShareBarDesc" },
  categoryShareBar: { titleKey: "widget.categoryShareBarTitle", descKey: "widget.categoryShareBarDesc" },

  incomeVsExpenseBars: { titleKey: "widget.incomeVsExpenseBarsTitle", descKey: "widget.incomeVsExpenseBarsDesc" },
  cashVsDigitalBars: { titleKey: "widget.cashVsDigitalBarsTitle", descKey: "widget.cashVsDigitalBarsDesc" },

  topCategories: { titleKey: "widget.topCategoriesTitle", descKey: "widget.topCategoriesDesc" },
  topMerchants: { titleKey: "widget.topMerchantsTitle", descKey: "widget.topMerchantsDesc" },
  topTags: { titleKey: "widget.topTagsTitle", descKey: "widget.topTagsDesc" },
  topIncomeSources: { titleKey: "widget.topIncomeSourcesTitle", descKey: "widget.topIncomeSourcesDesc" },
  walletDistribution: { titleKey: "widget.walletDistributionTitle", descKey: "widget.walletDistributionDesc" },
  expensesByWallet: { titleKey: "widget.expensesByWalletTitle", descKey: "widget.expensesByWalletDesc" },

  topMerchantsLeaderboard: { titleKey: "widget.topMerchantsLeaderboardTitle", descKey: "widget.topMerchantsLeaderboardDesc" },
  topCategoriesLeaderboard: { titleKey: "widget.topCategoriesLeaderboardTitle", descKey: "widget.topCategoriesLeaderboardDesc" },

  last7Days: { titleKey: "widget.last7DaysTitle", descKey: "widget.last7DaysDesc" },

  netWorthTicker: { titleKey: "widget.netWorthTickerTitle", descKey: "widget.netWorthTickerDesc" },
  walletTicker: { titleKey: "widget.walletTickerTitle", descKey: "widget.walletTickerDesc" },
  todayPill: { titleKey: "widget.todayPillTitle", descKey: "widget.todayPillDesc" },
  pacePill: { titleKey: "widget.pacePillTitle", descKey: "widget.pacePillDesc" },
  noSpendDays: { titleKey: "widget.noSpendDaysTitle", descKey: "widget.noSpendDaysDesc" },
  balanceHero: { titleKey: "widget.balanceHeroTitle", descKey: "widget.balanceHeroDesc" },
  payPeriodStepper: { titleKey: "widget.payPeriodStepperTitle", descKey: "widget.payPeriodStepperDesc" },
  spendingStreak: { titleKey: "widget.spendingStreakTitle", descKey: "widget.spendingStreakDesc" },

  budgetOverview: { titleKey: "widget.budgetOverviewTitle", descKey: "widget.budgetOverviewDesc" },
  savingsGoals: { titleKey: "widget.savingsGoalsWidgetTitle", descKey: "widget.savingsGoalsWidgetDesc" },

  welcome: { titleKey: "widget.welcomeTitle", descKey: "widget.welcomeDesc" },
};

// Groups the catalog above for the "Add a widget" picker, so a list of 60+
// options is browsable instead of one long scroll. Categorized by subject
// where a widget clearly has one (income/expense/wallet); cross-subject
// comparisons and budget/goal progress get their own buckets.
export const WIDGET_CATEGORIES = ["overview", "income", "expense", "wallet", "chart", "budget", "goals"] as const;
export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export const WIDGET_CATEGORY_LABEL_KEYS: Record<WidgetCategory, MessageKey> = {
  overview: "widgetCategory.overview",
  income: "summaryCard.income",
  expense: "summaryCard.expenses",
  wallet: "dashboardWidgets.wallet",
  chart: "widgetCategory.chart",
  budget: "widgetCategory.budget",
  goals: "widgetCategory.goals",
};

export const WIDGET_CATEGORY_OF: Record<DashboardWidgetType, WidgetCategory> = {
  welcome: "overview",
  summary: "overview",
  categoryOverview: "overview",
  wallets: "overview",
  recentTransactions: "overview",
  remainingCard: "overview",
  monthProgress: "overview",
  yearProgress: "overview",
  payPeriodStepper: "overview",
  transactionCount: "overview",
  categoryCount: "overview",
  tagCount: "overview",
  transfersTotal: "overview",
  walletCount: "overview",

  incomeCard: "income",
  todayIncome: "income",
  monthIncome: "income",
  yearIncome: "income",
  avgIncomeAmount: "income",
  biggestIncome: "income",
  incomeComparison: "income",
  last14DaysIncomeSpark: "income",
  topIncomeSources: "income",

  expensesCard: "expense",
  todaySpending: "expense",
  yesterdaySpending: "expense",
  weekSpending: "expense",
  monthSpending: "expense",
  yearSpending: "expense",
  avgDailySpending: "expense",
  avgTransactionAmount: "expense",
  biggestExpense: "expense",
  monthComparison: "expense",
  weekComparison: "expense",
  yearOverYear: "expense",
  spendPace: "expense",
  last14DaysSpark: "expense",
  last6MonthsSpark: "expense",
  categoryDonut: "expense",
  last30DaysHeatmap: "expense",
  last90DaysHeatmap: "expense",
  categoryShareBar: "expense",
  topCategories: "expense",
  topMerchants: "expense",
  topTags: "expense",
  topMerchantsLeaderboard: "expense",
  topCategoriesLeaderboard: "expense",
  last7Days: "expense",
  todayPill: "expense",
  pacePill: "expense",
  noSpendDays: "expense",
  spendingStreak: "expense",

  netWorth: "wallet",
  totalBalance: "wallet",
  walletUsage: "wallet",
  walletDonut: "wallet",
  walletShareBar: "wallet",
  walletDistribution: "wallet",
  expensesByWallet: "wallet",
  netWorthTicker: "wallet",
  walletTicker: "wallet",
  balanceHero: "wallet",
  cashVsDigitalBars: "wallet",

  incomeVsExpenseBars: "chart",
  typeDonut: "chart",

  savingsRate: "budget",
  budgetOverview: "budget",
  savingsGoals: "goals",
};

function makeId(type: DashboardWidgetType): string {
  return `${type}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DEFAULT_DASHBOARD_WIDGETS(): DashboardWidgetInstance[] {
  return [
    { id: makeId("welcome"), type: "welcome", width: "large" },
    { id: makeId("summary"), type: "summary", width: "large", cards: [...SUMMARY_CARDS] },
    { id: makeId("wallets"), type: "wallets", width: "large" },
    { id: makeId("walletTicker"), type: "walletTicker", width: "medium" },
    { id: makeId("recentTransactions"), type: "recentTransactions", width: "medium" },
  ];
}

export function newWidgetInstance(type: DashboardWidgetType): DashboardWidgetInstance {
  return {
    id: makeId(type),
    type,
    width: defaultWidthForType(type),
    cards: type === "summary" ? [...SUMMARY_CARDS] : undefined,
  };
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
      const normalizedRawWidth =
        typeof rawWidth === "string" ? (LEGACY_WIDTH_MAP[rawWidth] ?? rawWidth) : undefined;
      const width = clampWidthForType(
        type,
        normalizedRawWidth && isWidgetWidth(normalizedRawWidth) ? normalizedRawWidth : defaultWidthForType(type),
      );
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
      const rawHideAction = (item as { hideAction?: unknown }).hideAction;
      const hideAction = ACTION_HIDABLE_TYPES.includes(type) && rawHideAction === true ? true : undefined;
      const rawWalletId = (item as { walletId?: unknown }).walletId;
      const walletId = WALLET_CAPABLE_TYPES.includes(type) && typeof rawWalletId === "number" ? rawWalletId : undefined;
      result.push({
        id,
        type,
        width,
        cards: cards && cards.length > 0 ? cards : type === "summary" ? [...SUMMARY_CARDS] : undefined,
        accent,
        limit,
        hideAction,
        walletId,
      });
    }
  }
  if (result.length === 0 && raw.length === 0) return [];
  if (result.length === 0) return DEFAULT_DASHBOARD_WIDGETS();
  return result;
}
