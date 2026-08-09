// Four core, richly-interactive building blocks (own add-transaction
// buttons, its own chart-type controls, etc.) plus 50 small single-purpose
// visual widgets — see DASHBOARD_WIDGET_INFO for the full catalog and
// DashboardWidgetContent.tsx for what each one actually renders.
export const DASHBOARD_WIDGET_TYPES = [
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

// Three sizes on a 4-column grid — small is a quarter row, medium is half,
// large is the full row. Not every widget supports every size (see
// SUPPORTED_WIDTHS): a 3-card summary or a wide chart genuinely breaks at
// quarter width, so those simply never offer "small" as an option.
export const WIDGET_WIDTHS = ["small", "medium", "large"] as const;
export type WidgetWidth = (typeof WIDGET_WIDTHS)[number];

export function isWidgetWidth(value: string): value is WidgetWidth {
  return (WIDGET_WIDTHS as readonly string[]).includes(value);
}

export const WIDGET_WIDTH_LABELS: Record<WidgetWidth, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const WIDGET_WIDTH_COLSPAN: Record<WidgetWidth, string> = {
  small: "col-span-1",
  medium: "col-span-2",
  large: "col-span-4",
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

// Widgets whose headline number/line/ring/bars can take a chosen accent
// color instead of the neutral default (excludes ones with their own
// inherently multi-color content — donuts, stacked bars, leaderboards — or
// meaningful semantic red/green coloring — trend arrows, income/expense
// comparisons).
export const ACCENT_CAPABLE_TYPES: readonly DashboardWidgetType[] = [
  "netWorth",
  "totalBalance",
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
  "walletDistribution",
  "expensesByWallet",
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
};

export const DASHBOARD_WIDGET_INFO: Record<DashboardWidgetType, { title: string; description: string }> = {
  summary: { title: "Summary cards", description: "This month's income, expenses, and your remaining balance" },
  categoryOverview: { title: "Category breakdown", description: "Spending trend chart and category totals" },
  wallets: { title: "Wallets", description: "Each wallet's balance at a glance" },
  recentTransactions: { title: "Recent transactions", description: "Your latest transactions, as a timeline" },
  incomeCard: { title: "Income card", description: "This month's income — tap to add income" },
  expensesCard: { title: "Expenses card", description: "This month's expenses — tap to add an expense" },
  remainingCard: { title: "Remaining card", description: "Your remaining balance — tap to edit it" },

  todaySpending: { title: "Today's spending", description: "Total spent so far today" },
  yesterdaySpending: { title: "Yesterday's spending", description: "Total spent yesterday" },
  weekSpending: { title: "This week's spending", description: "Total spent since the start of the week" },
  monthSpending: { title: "This month's spending", description: "Total spent so far this month" },
  yearSpending: { title: "This year's spending", description: "Total spent so far this year" },
  todayIncome: { title: "Today's income", description: "Total received so far today" },
  monthIncome: { title: "This month's income", description: "Total received so far this month" },
  yearIncome: { title: "This year's income", description: "Total received so far this year" },
  netWorth: { title: "Net worth", description: "Combined balance across every wallet" },
  totalBalance: { title: "Total balance", description: "Sum of every active wallet's balance" },
  avgDailySpending: { title: "Average daily spending", description: "This month's spending divided by days elapsed" },
  avgTransactionAmount: { title: "Average transaction", description: "Average expense amount this month" },
  avgIncomeAmount: { title: "Average income", description: "Average income amount this month" },
  biggestExpense: { title: "Biggest expense", description: "Your largest single expense this month" },
  biggestIncome: { title: "Biggest income", description: "Your largest single income this month" },
  transactionCount: { title: "Transaction count", description: "Number of transactions logged this month" },
  transfersTotal: { title: "Transfers total", description: "Total moved via transfers this month" },
  walletCount: { title: "Wallet count", description: "Number of active wallets" },
  categoryCount: { title: "Categories used", description: "Distinct categories used this month" },
  tagCount: { title: "Tags used", description: "Distinct tags used this month" },

  monthComparison: { title: "Month vs last month", description: "How this month's spending compares to last month's" },
  incomeComparison: { title: "Income vs last month", description: "How this month's income compares to last month's" },
  weekComparison: { title: "Week vs last week", description: "How this week's spending compares to last week's" },
  yearOverYear: { title: "Year over year", description: "How this year's spending compares to last year's" },

  savingsRate: { title: "Savings rate", description: "Share of this month's income you kept" },
  monthProgress: { title: "Month progress", description: "How far through the current month you are" },
  yearProgress: { title: "Year progress", description: "How far through the current year you are" },
  spendPace: { title: "Spending pace", description: "This month's spend vs. an even day-by-day pace" },
  walletUsage: { title: "Wallet usage", description: "Your default wallet's share of your total balance" },

  last14DaysSpark: { title: "14-day spending trend", description: "A quick line of the last two weeks' spending" },
  last14DaysIncomeSpark: { title: "14-day income trend", description: "A quick line of the last two weeks' income" },
  last6MonthsSpark: { title: "6-month spending trend", description: "A quick line of the last six months' spending" },

  categoryDonut: { title: "Category split", description: "This month's spending by category, as a donut" },
  typeDonut: { title: "Transaction mix", description: "Share of expense/income/transfer transactions this month" },
  walletDonut: { title: "Balance split", description: "Share of your total balance held in each wallet" },

  last30DaysHeatmap: { title: "30-day activity", description: "A calendar heatmap of the last 30 days' spending" },
  last90DaysHeatmap: { title: "90-day activity", description: "A calendar heatmap of the last 90 days' spending" },

  walletShareBar: { title: "Wallet share bar", description: "Every wallet's share of your total balance, as one bar" },
  categoryShareBar: { title: "Category share bar", description: "This month's top categories, as one segmented bar" },

  incomeVsExpenseBars: { title: "Income vs expenses", description: "This month's income and spending side by side" },
  cashVsDigitalBars: { title: "Cash vs digital", description: "Balance held in cash wallets vs digital wallets" },

  topCategories: { title: "Top categories", description: "Your top spending categories this month" },
  topMerchants: { title: "Top merchants", description: "Merchants you've spent the most with this month" },
  topTags: { title: "Top tags", description: "Your most-used tags" },
  topIncomeSources: { title: "Top income sources", description: "Your highest-earning income categories this month" },
  walletDistribution: { title: "Wallet distribution", description: "Balance breakdown across your wallets" },
  expensesByWallet: { title: "Spending by wallet", description: "This month's spending broken down by wallet" },

  topMerchantsLeaderboard: { title: "Merchant leaderboard", description: "Your top merchants this month, ranked" },
  topCategoriesLeaderboard: { title: "Category leaderboard", description: "Your top categories this month, ranked" },

  last7Days: { title: "Last 7 days", description: "Daily spending for the past week, as bars" },

  netWorthTicker: { title: "Net worth ticker", description: "Your combined balance as a stock-style ticker card" },
  walletTicker: { title: "Wallet ticker", description: "Your default wallet's balance as a stock-style ticker card" },
  todayPill: { title: "Today pill", description: "Today's spending, as a compact pill" },
  pacePill: { title: "Spending pace pill", description: "This month's spend pace vs. last month, with a progress ring" },
  noSpendDays: { title: "No-spend streak", description: "Which days this week you didn't spend anything" },
  balanceHero: { title: "Balance hero", description: "A big balance card with your wallets and quick add buttons" },
  payPeriodStepper: { title: "Month progress stepper", description: "Where you are in the current month, as a stepper" },
  spendingStreak: { title: "Under-budget streak", description: "Days this week you spent less than your daily average" },

  budgetOverview: { title: "Budgets", description: "This month's spending against each category's budget" },
  savingsGoals: { title: "Savings goals", description: "Progress toward each of your savings goals" },
};

// Groups the catalog above for the "Add a widget" picker, so a list of 60+
// options is browsable instead of one long scroll. Categorized by subject
// where a widget clearly has one (income/expense/wallet); cross-subject
// comparisons and budget/goal progress get their own buckets.
export const WIDGET_CATEGORIES = ["overview", "income", "expense", "wallet", "chart", "budget", "goals"] as const;
export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  overview: "Overview",
  income: "Income",
  expense: "Expense",
  wallet: "Wallet",
  chart: "Charts",
  budget: "Budget",
  goals: "Goals",
};

export const WIDGET_CATEGORY_OF: Record<DashboardWidgetType, WidgetCategory> = {
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
