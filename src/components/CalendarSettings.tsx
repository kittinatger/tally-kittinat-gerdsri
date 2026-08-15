"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import type { CalendarSettings as CalendarSettingsData } from "@/lib/db";
import SelectDropdown from "./SelectDropdown";
import DatePicker from "./DatePicker";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

const WEEKDAY_KEYS: MessageKey[] = [
  "calendar.weekday.sunday",
  "calendar.weekday.monday",
  "calendar.weekday.tuesday",
  "calendar.weekday.wednesday",
  "calendar.weekday.thursday",
  "calendar.weekday.friday",
  "calendar.weekday.saturday",
];

const DEFAULT_VIEW_KEYS: { value: string; key: MessageKey }[] = [
  { value: "today", key: "calendar.view.today" },
  { value: "week", key: "calendar.view.thisWeek" },
  { value: "month", key: "calendar.view.thisMonth" },
  { value: "all", key: "calendar.view.allTime" },
];

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto (device)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Los_Angeles", label: "America/Los Angeles" },
  { value: "America/Sao_Paulo", label: "America/Sao Paulo" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Moscow", label: "Europe/Moscow" },
  { value: "Africa/Cairo", label: "Africa/Cairo" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland" },
];

const ALTERNATE_CALENDAR_KEYS: { value: string; key: MessageKey }[] = [
  { value: "none", key: "calendar.altcal.none" },
  { value: "lunar", key: "calendar.altcal.lunar" },
  { value: "buddhist", key: "calendar.altcal.buddhist" },
];

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
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
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const DEFAULTS: CalendarSettingsData = {
  weekStartDay: 0,
  monthStartDay: 1,
  biweeklyAnchorDate: null,
  defaultView: "today",
  timezone: "auto",
  showWeekNumbers: false,
  alternateCalendar: "none",
};

export default function CalendarSettings() {
  const t = useT();
  const WEEKDAY_OPTIONS = WEEKDAY_KEYS.map((k) => t(k));
  const DEFAULT_VIEW_OPTIONS = DEFAULT_VIEW_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const ALTERNATE_CALENDAR_OPTIONS = ALTERNATE_CALENDAR_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const [settings, setSettings] = useState<CalendarSettingsData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar-settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSettings({ ...DEFAULTS, ...data });
      })
      .catch(() => {
        // Keep defaults; the user can still edit and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<CalendarSettingsData>) {
    const previous = settings;
    setSettings((s) => ({ ...s, ...patch }));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setSettings(previous);
        setError("Could not save.");
      }
    } catch (err) {
      setSettings(previous);
      setError(describeFetchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* One grouped card with divided rows instead of seven separate
          floating cards — same convention as every other Settings list
          (WalletManager, TagManager, etc.), rather than a stack of
          near-identical boxes for what's really one settings group. */}
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.weekStartsOn")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("calendar.weekStartsOnDesc")}</p>
          <SelectDropdown
            value={WEEKDAY_OPTIONS[settings.weekStartDay]}
            options={WEEKDAY_OPTIONS}
            onChange={(label) => save({ weekStartDay: WEEKDAY_OPTIONS.indexOf(label) })}
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.monthStartsOn")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">
            {t("calendar.monthStartsOnDesc")}
          </p>
          <input
            type="number"
            min={1}
            max={28}
            value={settings.monthStartDay}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (Number.isFinite(value) && value >= 1 && value <= 28) save({ monthStartDay: value });
            }}
            className="w-24 rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.biweeklyAnchor")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">
            {t("calendar.biweeklyAnchorDesc")}
          </p>
          <div className="flex items-center gap-2">
            <DatePicker
              value={settings.biweeklyAnchorDate ?? ""}
              onChange={(value) => save({ biweeklyAnchorDate: value })}
            />
            {settings.biweeklyAnchorDate && (
              <button
                type="button"
                onClick={() => save({ biweeklyAnchorDate: null })}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
              >
                {t("common.clear")}
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.defaultView")}</p>
          <SelectDropdown
            value={DEFAULT_VIEW_OPTIONS.find((o) => o.value === settings.defaultView)?.label ?? t("calendar.view.today")}
            options={DEFAULT_VIEW_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = DEFAULT_VIEW_OPTIONS.find((o) => o.label === label);
              if (opt) save({ defaultView: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.timezone")}</p>
          <SelectDropdown
            value={TIMEZONE_OPTIONS.find((o) => o.value === settings.timezone)?.label ?? t("calendar.tz.auto")}
            options={TIMEZONE_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = TIMEZONE_OPTIONS.find((o) => o.label === label);
              if (opt) save({ timezone: opt.value });
            }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("calendar.showWeekNumbers")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("calendar.showWeekNumbersDesc")}</p>
            </div>
            <Toggle
              checked={settings.showWeekNumbers}
              onChange={() => save({ showWeekNumbers: !settings.showWeekNumbers })}
              disabled={saving}
              label={t("calendar.showWeekNumbers")}
            />
          </div>
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("calendar.alternateCalendar")}</p>
          <p className="mb-2 text-[11px] leading-snug text-ink-soft">{t("calendar.alternateCalendarDesc")}</p>
          <SelectDropdown
            value={ALTERNATE_CALENDAR_OPTIONS.find((o) => o.value === settings.alternateCalendar)?.label ?? t("calendar.altcal.none")}
            options={ALTERNATE_CALENDAR_OPTIONS.map((o) => o.label)}
            onChange={(label) => {
              const opt = ALTERNATE_CALENDAR_OPTIONS.find((o) => o.label === label);
              if (opt) save({ alternateCalendar: opt.value });
            }}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
