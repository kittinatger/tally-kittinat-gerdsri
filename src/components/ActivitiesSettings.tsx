"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import {
  DEFAULT_ACTIVITIES_PREFS,
  ACTIVITIES_TYPE_FILTERS,
  ACTIVITIES_SORTS,
  ACTIVITIES_DATE_RANGES,
  ACTIVITIES_GROUP_BYS,
  type ActivitiesPrefs,
} from "@/lib/activities-prefs";
import SelectDropdown from "./SelectDropdown";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

const TYPE_FILTER_KEYS: Record<(typeof ACTIVITIES_TYPE_FILTERS)[number], MessageKey> = {
  all: "activities.typeAll",
  expense: "common.expense",
  income: "common.income",
  transfer: "common.transfer",
};

const SORT_KEYS: Record<(typeof ACTIVITIES_SORTS)[number], MessageKey> = {
  newest: "activities.sortNewest",
  oldest: "activities.sortOldest",
  amountDesc: "activities.sortAmountDesc",
  amountAsc: "activities.sortAmountAsc",
};

const DATE_RANGE_KEYS: Record<(typeof ACTIVITIES_DATE_RANGES)[number], MessageKey> = {
  none: "activities.dateRangeNone",
  "7": "activities.dateRangeLast7",
  "30": "activities.dateRangeLast30",
  "90": "activities.dateRangeLast90",
  thisMonth: "activities.dateRangeThisMonth",
};

const GROUP_BY_KEYS: Record<(typeof ACTIVITIES_GROUP_BYS)[number], MessageKey> = {
  none: "activities.groupByOptionNone",
  day: "activities.groupByOptionDay",
  week: "activities.groupByOptionWeek",
  month: "activities.groupByOptionMonth",
};

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
        checked ? "bg-navy" : "bg-bg-soft"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

export default function ActivitiesSettings() {
  const t = useT();
  const TYPE_FILTER_OPTIONS = ACTIVITIES_TYPE_FILTERS.map((v) => ({ value: v, label: t(TYPE_FILTER_KEYS[v]) }));
  const SORT_OPTIONS = ACTIVITIES_SORTS.map((v) => ({ value: v, label: t(SORT_KEYS[v]) }));
  const DATE_RANGE_OPTIONS = ACTIVITIES_DATE_RANGES.map((v) => ({ value: v, label: t(DATE_RANGE_KEYS[v]) }));
  const GROUP_BY_OPTIONS = ACTIVITIES_GROUP_BYS.map((v) => ({ value: v, label: t(GROUP_BY_KEYS[v]) }));

  const [prefs, setPrefs] = useState<ActivitiesPrefs>(DEFAULT_ACTIVITIES_PREFS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/activities-settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPrefs({ ...DEFAULT_ACTIVITIES_PREFS, ...data });
      })
      .catch(() => {
        // Keep defaults; the user can still edit and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<ActivitiesPrefs>) {
    const previous = prefs;
    setPrefs((p) => ({ ...p, ...patch }));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/activities-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setPrefs(previous);
        setError("Could not save.");
      }
    } catch (err) {
      setPrefs(previous);
      setError(describeFetchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-soft">{t("activities.settingsDesc")}</p>
      {/* One grouped card with divided rows, same convention as
       * CalendarSettings and every other Settings list. */}
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("activities.hideMerchantIcons")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("activities.hideMerchantIconsDesc")}</p>
            </div>
            <Toggle
              checked={prefs.hideMerchantIcons}
              onChange={() => save({ hideMerchantIcons: !prefs.hideMerchantIcons })}
              disabled={saving}
              label={t("activities.hideMerchantIcons")}
            />
          </div>
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("activities.defaultTypeFilter")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("activities.defaultTypeFilterDesc")}</p>
          <SelectDropdown
            value={TYPE_FILTER_OPTIONS.find((o) => o.value === prefs.defaultTypeFilter)?.label ?? TYPE_FILTER_OPTIONS[0].label}
            options={TYPE_FILTER_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = TYPE_FILTER_OPTIONS.find((o) => o.label === label);
              if (opt) save({ defaultTypeFilter: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("activities.defaultSort")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("activities.defaultSortDesc")}</p>
          <SelectDropdown
            value={SORT_OPTIONS.find((o) => o.value === prefs.defaultSort)?.label ?? SORT_OPTIONS[0].label}
            options={SORT_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = SORT_OPTIONS.find((o) => o.label === label);
              if (opt) save({ defaultSort: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("activities.defaultDateRange")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("activities.defaultDateRangeDesc")}</p>
          <SelectDropdown
            value={DATE_RANGE_OPTIONS.find((o) => o.value === prefs.defaultDateRangeDays)?.label ?? DATE_RANGE_OPTIONS[0].label}
            options={DATE_RANGE_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = DATE_RANGE_OPTIONS.find((o) => o.label === label);
              if (opt) save({ defaultDateRangeDays: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("activities.groupBy")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("activities.groupByDesc")}</p>
          <SelectDropdown
            value={GROUP_BY_OPTIONS.find((o) => o.value === prefs.groupBy)?.label ?? GROUP_BY_OPTIONS[0].label}
            options={GROUP_BY_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = GROUP_BY_OPTIONS.find((o) => o.label === label);
              if (opt) save({ groupBy: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("activities.collapseSplitGroups")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("activities.collapseSplitGroupsDesc")}</p>
            </div>
            <Toggle
              checked={prefs.collapseSplitGroups}
              onChange={() => save({ collapseSplitGroups: !prefs.collapseSplitGroups })}
              disabled={saving}
              label={t("activities.collapseSplitGroups")}
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("activities.compactRows")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("activities.compactRowsDesc")}</p>
            </div>
            <Toggle
              checked={prefs.compactRows}
              onChange={() => save({ compactRows: !prefs.compactRows })}
              disabled={saving}
              label={t("activities.compactRows")}
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("activities.hideTagsInRow")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("activities.hideTagsInRowDesc")}</p>
            </div>
            <Toggle
              checked={prefs.hideTagsInRow}
              onChange={() => save({ hideTagsInRow: !prefs.hideTagsInRow })}
              disabled={saving}
              label={t("activities.hideTagsInRow")}
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>}
    </div>
  );
}
