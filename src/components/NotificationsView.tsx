"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  BellSimpleSlashIcon,
  ChartPieSliceIcon,
  CheckIcon,
  ChecksIcon,
  DotsThreeIcon,
  GearSixIcon,
  HandCoinsIcon,
  RocketLaunchIcon,
  TrashIcon,
  UserCheckIcon,
  UserPlusIcon,
  WalletIcon,
  CalendarCheckIcon,
  ReceiptIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { NotificationRow } from "@/lib/db";
import { formatRelativeTime } from "@/lib/format";
import { useT } from "@/lib/language-context";
import {
  deleteNotification,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@/lib/notification-store";
import { notificationTypeInfo, type NotificationGroup } from "@/lib/notification-types";
import AppHeader from "./AppHeader";

type Filter = "all" | "unread" | NotificationGroup;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "money", label: "Money" },
  { id: "social", label: "Friends & sharing" },
  { id: "tally", label: "Updates" },
];

// Icon and tint per notification type; unknown/old types fall back to a bell-ish default.
const LOOK: Record<string, { icon: Icon; tint: string }> = {
  recurring_logged: { icon: ArrowsClockwiseIcon, tint: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  budget_over_limit: { icon: ChartPieSliceIcon, tint: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  loan_due: { icon: CalendarCheckIcon, tint: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  friend_request: { icon: UserPlusIcon, tint: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  friend_accepted: { icon: UserCheckIcon, tint: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  split_added: { icon: ReceiptIcon, tint: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  split_activity: { icon: HandCoinsIcon, tint: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  wallet_invite: { icon: WalletIcon, tint: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  wallet_activity: { icon: WalletIcon, tint: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  app_update: { icon: RocketLaunchIcon, tint: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
};
const FALLBACK_LOOK = { icon: ChecksIcon, tint: "bg-surface-soft text-surface-foreground-soft" };

// "Today", "Yesterday", "This week", "Earlier" — by the local calendar day.
function dayBucket(iso: string): string {
  const then = new Date(iso);
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(then)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  return "Earlier";
}

export default function NotificationsView() {
  const t = useT();
  const { notifications, unreadCount, loaded } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  // What counts as "New" is fixed when the list first loads, so reading an
  // item doesn't make it jump to another section (and lose its place)
  // while you're looking at it; anything arriving later and unread joins it.
  const [newIds, setNewIds] = useState<Set<number> | null>(null);
  if (loaded && newIds === null) setNewIds(new Set(notifications.filter((n) => !n.read).map((n) => n.id)));
  const isNew = (n: NotificationRow) => !n.read || (newIds?.has(n.id) ?? false);

  useEffect(() => {
    loadNotifications(true);
    fetch("/api/notifications/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setPausedUntil(data.pausedUntil ?? null);
        setMutedTypes(Object.entries(data.prefs ?? {}).filter(([, on]) => on === false).map(([type]) => type));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const visible = useMemo(
    () =>
      notifications.filter((n) =>
        filter === "all" ? true : filter === "unread" ? !n.read : notificationTypeInfo(n.type)?.group === filter,
      ),
    [notifications, filter],
  );

  // Unread first as "New", then the rest by day.
  const sections = useMemo(() => {
    const out: { title: string; items: NotificationRow[] }[] = [];
    const push = (title: string, n: NotificationRow) => {
      const last = out[out.length - 1];
      if (last && last.title === title) last.items.push(n);
      else out.push({ title, items: [n] });
    };
    if (filter === "unread") {
      visible.forEach((n) => push(dayBucket(n.created_at), n));
      return out;
    }
    visible.filter(isNew).forEach((n) => push("New", n));
    visible.filter((n) => !isNew(n)).forEach((n) => push(dayBucket(n.created_at), n));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isNew only reads newIds
  }, [visible, filter, newIds]);

  async function turnOff(type: string) {
    const info = notificationTypeInfo(type);
    setMutedTypes((prev) => [...prev, type]);
    setToast(`Turned off “${info?.title ?? "these"}” notifications`);
    await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, enabled: false }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-1 py-4 sm:px-2 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-foreground">{t("notification.title")}</h1>
            <p className="text-sm text-ink-soft">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold text-foreground transition hover:bg-bg-soft"
              >
                <ChecksIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                <span className="hidden min-[400px]:inline">{t("notification.markAllRead")}</span>
              </button>
            )}
            <Link
              href="/notifications/settings"
              aria-label="Notification settings"
              title="Notification settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition hover:text-foreground"
            >
              <GearSixIcon weight="bold" aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {pausedUntil && (
          <Link
            href="/notifications/settings"
            className="mb-4 flex items-center gap-3 rounded-card border border-amber-300/70 bg-amber-500/10 px-4 py-3 text-sm dark:border-amber-800/60"
          >
            <BellSimpleSlashIcon weight="fill" aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="min-w-0 flex-1 text-foreground">
              Notifications are paused until{" "}
              {new Date(pausedUntil).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
            </span>
            <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-300">Resume</span>
          </Link>
        )}

        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === f.id ? "border-transparent bg-navy text-white" : "border-line text-ink-soft hover:text-foreground"
              }`}
            >
              {f.label}
              {f.id === "unread" && unreadCount > 0 && <span className="ml-1.5 opacity-80">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {!loaded ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-card bg-surface" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-ink-soft">
              <CheckIcon weight="bold" aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="font-semibold text-foreground">{filter === "unread" ? "Nothing unread" : t("notification.empty")}</p>
            <p className="max-w-xs text-sm text-ink-soft">
              {filter === "all" ? "Budget alerts, recurring payments, friends, split bills and Tally updates will show up here." : "Nothing here yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{section.title}</h2>
                <ul className="divide-y divide-surface-line overflow-hidden rounded-card border border-surface-line bg-surface">
                  {section.items.map((n) => (
                    <NotificationItem key={n.id} notification={n} muted={mutedTypes.includes(n.type)} onTurnOff={() => turnOff(n.type)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed inset-x-0 bottom-[calc(64px+var(--mobile-nav-bottom-pad,10px)+12px)] z-30 flex justify-center px-4 sm:bottom-6" role="status">
          <div className="flex items-center gap-3 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-soft">
            {toast}
            <Link href="/notifications/settings" className="font-semibold underline underline-offset-2">
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, muted, onTurnOff }: { notification: NotificationRow; muted: boolean; onTurnOff: () => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const look = LOOK[n.type] ?? FALLBACK_LOOK;
  const info = notificationTypeInfo(n.type);
  const isUpdate = n.type === "app_update";
  const lines = n.body.split("\n").filter(Boolean);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  function open() {
    markNotificationRead(n.id);
    // Updates expand in place to list what's new; others jump to what they're about.
    if (isUpdate) setExpanded((v) => !v);
    else if (n.url) router.push(n.url);
  }

  return (
    <li className={`relative ${n.read ? "" : "bg-surface-accent/[0.04]"}`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button type="button" onClick={open} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${look.tint}`}>
            <look.icon weight="fill" aria-hidden="true" className="h-5 w-5" />
            {!n.read && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-red-500" aria-label="Unread" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-sm text-surface-foreground ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</span>
            {isUpdate ? (
              <span className="mt-0.5 block text-sm text-surface-foreground-soft">
                {expanded ? "What's new:" : `${lines.length} new thing${lines.length === 1 ? "" : "s"} · tap to see`}
              </span>
            ) : (
              n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-surface-foreground-soft">{n.body}</span>
            )}
            <span className="mt-1 block text-xs text-surface-foreground-soft/80">
              {formatRelativeTime(n.created_at)}
              {info && <> · {info.title}</>}
            </span>
          </span>
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            aria-expanded={menuOpen}
            className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <DotsThreeIcon weight="bold" aria-hidden="true" className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-60 overflow-hidden rounded-2xl border border-surface-line bg-surface p-1.5 shadow-soft">
              {!n.read && (
                <MenuItem icon={ChecksIcon} onClick={() => (markNotificationRead(n.id), setMenuOpen(false))}>
                  Mark as read
                </MenuItem>
              )}
              {info && !muted && (
                <MenuItem icon={BellSimpleSlashIcon} onClick={() => (onTurnOff(), setMenuOpen(false))}>
                  Turn off “{info.title}”
                </MenuItem>
              )}
              <MenuItem icon={TrashIcon} danger onClick={() => deleteNotification(n.id)}>
                Delete
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      {isUpdate && expanded && (
        <div className="px-4 pb-4 pl-[68px]">
          <ul className="space-y-1.5">
            {lines.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-surface-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/changelog" className="mt-3 inline-flex text-sm font-semibold text-surface-accent hover:underline">
            See the full changelog
          </Link>
        </div>
      )}
    </li>
  );
}

function MenuItem({ icon: ItemIcon, danger, onClick, children }: { icon: Icon; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-[var(--surface-nav-hover)] ${
        danger ? "text-red-600 dark:text-red-400" : "text-surface-foreground"
      }`}
    >
      <ItemIcon weight="bold" aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
