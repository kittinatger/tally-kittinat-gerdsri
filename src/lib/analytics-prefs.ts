// User-configurable preferences for the /analytics page — see
// app_settings.analytics_prefs in db.ts. One JSON-blob column, same
// convention as activities_prefs (src/lib/activities-prefs.ts): a
// cohesive small preferences concept, not a set of unrelated toggles.
//
// Deliberately small — the page itself is mostly fixed (see the
// analytics rebuild plan); this only holds the one real cross-cutting
// setting (which period it opens to) plus which of the 6 fixed sections
// are hidden. No per-section reordering/resizing/config, unlike the old
// dashboard-widgets system this replaces.
import { ANALYTICS_PERIODS, type AnalyticsPeriodId } from "@/lib/analytics";

export const ANALYTICS_SECTION_IDS = ["overview", "trend", "categories", "netWorth", "budgets", "forward"] as const;
export type AnalyticsSectionId = (typeof ANALYTICS_SECTION_IDS)[number];

export type AnalyticsPrefs = {
  defaultPeriod: AnalyticsPeriodId;
  hiddenSections: AnalyticsSectionId[];
};

export const DEFAULT_ANALYTICS_PREFS: AnalyticsPrefs = {
  defaultPeriod: "thisMonth",
  hiddenSections: [],
};

function isAnalyticsPeriodId(value: unknown): value is AnalyticsPeriodId {
  return typeof value === "string" && (ANALYTICS_PERIODS as readonly string[]).includes(value);
}

function isAnalyticsSectionId(value: unknown): value is AnalyticsSectionId {
  return typeof value === "string" && (ANALYTICS_SECTION_IDS as readonly string[]).includes(value);
}

// Defensive parse for whatever's actually stored in the JSON column —
// same style as normalizeActivitiesPrefs/normalizeDashboardWidgets.
export function normalizeAnalyticsPrefs(raw: unknown): AnalyticsPrefs {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    defaultPeriod: isAnalyticsPeriodId(obj.defaultPeriod) ? obj.defaultPeriod : DEFAULT_ANALYTICS_PREFS.defaultPeriod,
    hiddenSections: Array.isArray(obj.hiddenSections) ? obj.hiddenSections.filter(isAnalyticsSectionId) : DEFAULT_ANALYTICS_PREFS.hiddenSections,
  };
}
