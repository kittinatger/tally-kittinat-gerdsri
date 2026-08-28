"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useT } from "@/lib/language-context";
import { pushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-subscribe";

export default function NotificationSettings({ hasEmail }: { hasEmail: boolean }) {
  const t = useT();
  const [notifyRecurring, setNotifyRecurring] = useState(false);
  const [notifyBudget, setNotifyBudget] = useState(false);
  const [notifyPush, setNotifyPush] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingPush, setSavingPush] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setNotifyRecurring(Boolean(data.notifyRecurringEmail));
        setNotifyBudget(Boolean(data.notifyBudgetEmail));
        setNotifyPush(Boolean(data.notifyPushReminders));
      })
      .catch(() => {
        // Leave the toggles at their defaults; the user can still flip them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePush(next: boolean) {
    setPushError(null);
    setSavingPush(true);
    try {
      if (next) {
        const result = await subscribeToPush();
        if (!result.ok) {
          setPushError(result.error);
          return;
        }
      } else {
        await unsubscribeFromPush();
      }
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyPushReminders: next }),
      });
      if (res.ok) setNotifyPush(next);
      else setPushError(t("notifications.saveFailed"));
    } catch (err) {
      setPushError(describeFetchError(err));
    } finally {
      setSavingPush(false);
    }
  }

  async function toggle(field: "notifyRecurringEmail" | "notifyBudgetEmail", next: boolean) {
    const setValue = field === "notifyRecurringEmail" ? setNotifyRecurring : setNotifyBudget;
    const setSaving = field === "notifyRecurringEmail" ? setSavingRecurring : setSavingBudget;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) {
        setValue(!next);
        setError("Could not save.");
      }
    } catch (err) {
      setValue(!next);
      setError(describeFetchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-3.5 text-sm font-medium text-foreground">{t("notifications.emailTitle")}</p>
      {!hasEmail ? (
        <p className="text-[11px] leading-snug text-ink-soft">
          {t("notifications.addEmailFirst")}
        </p>
      ) : (
        <>
          <p className="mb-3.5 text-[11px] leading-snug text-ink-soft">
            {t("notifications.noBackgroundWorker")}
          </p>

          <div className="border-t border-[var(--glass-border)] pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t("notifications.recurringLoggedTitle")}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
                  {t("notifications.recurringLoggedDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("notifyRecurringEmail", !notifyRecurring)}
                disabled={savingRecurring}
                role="switch"
                aria-checked={notifyRecurring}
                aria-label={t("notifications.recurringLoggedTitle")}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
                  notifyRecurring ? "bg-navy" : "bg-bg-soft"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    notifyRecurring ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-3.5 border-t border-[var(--glass-border)] pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t("notifications.overBudgetTitle")}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
                  {t("notifications.overBudgetDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("notifyBudgetEmail", !notifyBudget)}
                disabled={savingBudget}
                role="switch"
                aria-checked={notifyBudget}
                aria-label={t("notifications.overBudgetTitle")}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
                  notifyBudget ? "bg-navy" : "bg-bg-soft"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    notifyBudget ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}

      {pushSupported() && (
        <div className="mt-5 border-t border-[var(--glass-border)] pt-3.5">
          <p className="mb-3.5 text-sm font-medium text-foreground">{t("notifications.pushTitle")}</p>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("notifications.loanRemindersTitle")}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{t("notifications.loanRemindersDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => togglePush(!notifyPush)}
              disabled={savingPush}
              role="switch"
              aria-checked={notifyPush}
              aria-label={t("notifications.loanRemindersTitle")}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
                notifyPush ? "bg-navy" : "bg-bg-soft"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  notifyPush ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {pushError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{pushError}</p>}
        </div>
      )}
    </div>
  );
}
