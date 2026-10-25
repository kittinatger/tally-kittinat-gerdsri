"use client";

import { useState } from "react";
import Link from "next/link";
import { BellSimpleSlashIcon, CaretLeftIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import {
  NOTIFICATION_GROUPS,
  NOTIFICATION_TYPES,
  isNotificationTypeOn,
  type NotificationPrefs,
  type NotificationType,
} from "@/lib/notification-types";
import { useT } from "@/lib/language-context";
import AppHeader from "./AppHeader";
import NotificationSettings from "./NotificationSettings";

const PAUSE_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 60, label: "1 hour" },
  { minutes: 8 * 60, label: "8 hours" },
  { minutes: 24 * 60, label: "1 day" },
  { minutes: 7 * 24 * 60, label: "1 week" },
];

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${on ? "bg-navy" : "bg-bg-soft"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function NotificationPreferencesView({
  initialPrefs,
  initialPausedUntil,
  hasEmail,
}: {
  initialPrefs: NotificationPrefs;
  initialPausedUntil: string | null;
  hasEmail: boolean;
}) {
  const t = useT();
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [pausedUntil, setPausedUntil] = useState<string | null>(initialPausedUntil);
  const [pausePicker, setPausePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paused = pausedUntil !== null;

  async function patch(body: object): Promise<boolean> {
    setError(null);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Type switches are already applied optimistically (and several can be
      // in flight at once from "Turn all off"), so only the pause state is
      // taken from the response.
      setPausedUntil(data.pausedUntil ?? null);
      return true;
    } catch {
      setError(t("notifications.saveFailed"));
      return false;
    }
  }

  function setType(type: NotificationType, enabled: boolean) {
    const before = prefs;
    setPrefs((prev) => {
      const next = { ...prev };
      if (enabled) delete next[type];
      else next[type] = false;
      return next;
    });
    patch({ type, enabled }).then((ok) => !ok && setPrefs(before));
  }

  function setGroup(group: string, enabled: boolean) {
    NOTIFICATION_TYPES.filter((n) => n.group === group && isNotificationTypeOn(prefs, n.type) !== enabled).forEach((n) => setType(n.type, enabled));
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-1 py-4 sm:px-2 sm:py-6">
        <Link href="/notifications" className="mb-4 flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-foreground">
          <CaretLeftIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
          {t("notification.title")}
        </Link>
        <h1 className="font-display text-2xl text-foreground">Notification settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Choose what Tally tells you about. Turned-off notifications aren&apos;t saved at all.</p>

        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Pause all */}
        <section className="mt-6 overflow-hidden rounded-card border border-surface-line bg-surface">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BellSimpleSlashIcon weight="fill" aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-foreground">Pause all</p>
              <p className="text-xs text-surface-foreground-soft">
                {paused
                  ? `Paused until ${new Date(pausedUntil!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                  : "Temporarily stop every notification."}
              </p>
            </div>
            <Switch
              on={paused || pausePicker}
              label="Pause all"
              onChange={(next) => {
                if (next) setPausePicker(true);
                else {
                  setPausePicker(false);
                  patch({ pauseMinutes: null });
                }
              }}
            />
          </div>
          {pausePicker && !paused && (
            <div className="flex flex-wrap gap-2 border-t border-surface-line px-4 py-3">
              {PAUSE_OPTIONS.map((o) => (
                <button
                  key={o.minutes}
                  type="button"
                  onClick={async () => {
                    if (await patch({ pauseMinutes: o.minutes })) setPausePicker(false);
                  }}
                  className="rounded-full border border-surface-line px-3.5 py-1.5 text-sm font-semibold text-surface-foreground transition hover:border-surface-accent"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Per-type switches, grouped */}
        {NOTIFICATION_GROUPS.map((g) => {
          const types = NOTIFICATION_TYPES.filter((n) => n.group === g.group);
          const allOn = types.every((n) => isNotificationTypeOn(prefs, n.type));
          return (
            <section key={g.group} className="mt-6">
              <div className="mb-2 flex items-end justify-between gap-3 px-1">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{g.title}</h2>
                  <p className="text-xs text-ink-soft/80">{g.description}</p>
                </div>
                {types.length > 1 && (
                  <button type="button" onClick={() => setGroup(g.group, !allOn)} className="shrink-0 text-xs font-semibold text-surface-accent hover:underline">
                    {allOn ? "Turn all off" : "Turn all on"}
                  </button>
                )}
              </div>
              <div className={`divide-y divide-surface-line overflow-hidden rounded-card border border-surface-line bg-surface ${paused ? "opacity-60" : ""}`}>
                {types.map((n) => {
                  const on = isNotificationTypeOn(prefs, n.type);
                  return (
                    <div key={n.type} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-surface-foreground">{n.title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-surface-foreground-soft">{n.description}</p>
                      </div>
                      <Switch on={on} label={n.title} onChange={(next) => setType(n.type, next)} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Email & push (unchanged options, moved here from Permissions) */}
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <EnvelopeSimpleIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
            Email &amp; push
          </h2>
          <div className="overflow-hidden rounded-card border border-line bg-surface p-4">
            <NotificationSettings hasEmail={hasEmail} />
          </div>
        </section>
      </main>
    </div>
  );
}
