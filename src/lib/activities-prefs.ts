// User-configurable defaults/display options for the Activities page —
// see app_settings.activities_prefs in db.ts. One JSON-blob column
// rather than one column per field (same convention as
// dashboard_widgets in dashboard-widgets.ts) since this is one cohesive
// "Activities preferences" concept likely to keep growing, not a set of
// unrelated toggles.
//
// Every field here is a *starting point* for the Activities page, not a
// locked-in behavior — the page's own in-session filter/sort controls
// still work exactly as before; a preference only decides what the page
// looks like the moment it's opened.

export const ACTIVITIES_TYPE_FILTERS = ["all", "expense", "income", "transfer"] as const;
export type ActivitiesTypeFilter = (typeof ACTIVITIES_TYPE_FILTERS)[number];

export const ACTIVITIES_SORTS = ["newest", "oldest", "amountDesc", "amountAsc"] as const;
export type ActivitiesSort = (typeof ACTIVITIES_SORTS)[number];

export const ACTIVITIES_DATE_RANGES = ["none", "7", "30", "90", "thisMonth"] as const;
export type ActivitiesDateRange = (typeof ACTIVITIES_DATE_RANGES)[number];

export type ActivitiesPrefs = {
  /** Hides the circular category-icon badge at the left of every row. */
  hideMerchantIcons: boolean;
  /** Which type tab Activities opens to — "all" (default) shows every
   * transaction, same as today. */
  defaultTypeFilter: ActivitiesTypeFilter;
  /** Initial sort order — "newest" (default) matches today's hardcoded
   * behavior. */
  defaultSort: ActivitiesSort;
  /** Whether rows start grouped under month headers (default true, same
   * as today) or as one flat sorted list. */
  groupByMonth: boolean;
  /** Whether a split-expense group starts collapsed rather than
   * expanded. */
  collapseSplitGroups: boolean;
  /** Tighter row padding and a smaller category icon. */
  compactRows: boolean;
  /** Hides the tag chips shown under each row's merchant/category line
   * — tags stay visible in the expense detail view either way. */
  hideTagsInRow: boolean;
  /** Initial date-range filter — "none" (default) shows everything,
   * same as today. */
  defaultDateRangeDays: ActivitiesDateRange;
};

export const DEFAULT_ACTIVITIES_PREFS: ActivitiesPrefs = {
  hideMerchantIcons: false,
  defaultTypeFilter: "all",
  defaultSort: "newest",
  groupByMonth: true,
  collapseSplitGroups: false,
  compactRows: false,
  hideTagsInRow: false,
  defaultDateRangeDays: "none",
};

function isActivitiesTypeFilter(value: unknown): value is ActivitiesTypeFilter {
  return typeof value === "string" && (ACTIVITIES_TYPE_FILTERS as readonly string[]).includes(value);
}

function isActivitiesSort(value: unknown): value is ActivitiesSort {
  return typeof value === "string" && (ACTIVITIES_SORTS as readonly string[]).includes(value);
}

function isActivitiesDateRange(value: unknown): value is ActivitiesDateRange {
  return typeof value === "string" && (ACTIVITIES_DATE_RANGES as readonly string[]).includes(value);
}

// Compares two expense-shaped records for ExpenseList's sort — kept
// generic (just the three fields actually needed) rather than importing
// the real Expense type here, so this stays a leaf module with no
// dependency on types/expense.ts.
export function compareActivitiesSort(
  a: { date: string; id: number; amount: number },
  b: { date: string; id: number; amount: number },
  sort: ActivitiesSort,
): number {
  switch (sort) {
    case "oldest":
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.id - b.id;
    case "amountDesc":
      return Math.abs(b.amount) - Math.abs(a.amount);
    case "amountAsc":
      return Math.abs(a.amount) - Math.abs(b.amount);
    case "newest":
    default:
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.id - a.id;
  }
}

// Turns a date-range preset into a starting {from, to} pair for
// ExpenseList's own date-range filter — "" means "no bound", matching
// how that filter's own dateFrom/dateTo state already represents "unset".
export function resolveDefaultDateRange(range: ActivitiesDateRange): { from: string; to: string } {
  if (range === "none") return { from: "", to: "" };
  const now = new Date();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  if (range === "thisMonth") {
    return { from: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), to: "" };
  }
  const days = Number(range);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: toIso(start), to: "" };
}

// Defensive parse for whatever's actually stored in the JSON column —
// missing/garbage fields silently fall back to their default rather than
// rejecting the whole blob, same style as normalizeDashboardWidgets.
export function normalizeActivitiesPrefs(raw: unknown): ActivitiesPrefs {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    hideMerchantIcons: obj.hideMerchantIcons === true,
    defaultTypeFilter: isActivitiesTypeFilter(obj.defaultTypeFilter) ? obj.defaultTypeFilter : DEFAULT_ACTIVITIES_PREFS.defaultTypeFilter,
    defaultSort: isActivitiesSort(obj.defaultSort) ? obj.defaultSort : DEFAULT_ACTIVITIES_PREFS.defaultSort,
    groupByMonth: typeof obj.groupByMonth === "boolean" ? obj.groupByMonth : DEFAULT_ACTIVITIES_PREFS.groupByMonth,
    collapseSplitGroups: obj.collapseSplitGroups === true,
    compactRows: obj.compactRows === true,
    hideTagsInRow: obj.hideTagsInRow === true,
    defaultDateRangeDays: isActivitiesDateRange(obj.defaultDateRangeDays)
      ? obj.defaultDateRangeDays
      : DEFAULT_ACTIVITIES_PREFS.defaultDateRangeDays,
  };
}
