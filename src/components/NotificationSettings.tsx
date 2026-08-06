"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";

export default function NotificationSettings({ hasEmail }: { hasEmail: boolean }) {
  const [notifyRecurring, setNotifyRecurring] = useState(false);
  const [notifyBudget, setNotifyBudget] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setNotifyRecurring(Boolean(data.notifyRecurringEmail));
        setNotifyBudget(Boolean(data.notifyBudgetEmail));
      })
      .catch(() => {
        // Leave the toggles at their defaults; the user can still flip them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <p className="mb-3.5 text-sm font-medium text-foreground">Email notifications</p>
      {!hasEmail ? (
        <p className="text-[11px] leading-snug text-ink-soft">
          Add an email in Account first to enable email notifications.
        </p>
      ) : (
        <>
          <p className="mb-3.5 text-[11px] leading-snug text-ink-soft">
            There&apos;s no background worker in this app — notifications send the next time you open Tally after
            the triggering event, not the instant it happens.
          </p>

          <div className="border-t border-[var(--glass-border)] pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Recurring transactions logged</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
                  Email me a summary whenever a recurring rule auto-logs a transaction.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("notifyRecurringEmail", !notifyRecurring)}
                disabled={savingRecurring}
                role="switch"
                aria-checked={notifyRecurring}
                aria-label="Toggle recurring transaction email notifications"
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
                <p className="text-sm font-medium text-foreground">Over budget</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
                  Email me once per month the first time a category goes over its budget.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("notifyBudgetEmail", !notifyBudget)}
                disabled={savingBudget}
                role="switch"
                aria-checked={notifyBudget}
                aria-label="Toggle over-budget email notifications"
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
    </div>
  );
}
