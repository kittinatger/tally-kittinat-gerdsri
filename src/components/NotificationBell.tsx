"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { BellIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { NotificationRow } from "@/lib/db";

const Modal = dynamic(() => import("./Modal"));
const NotificationList = dynamic(() => import("./NotificationList"));

// One shared store for every bell on the page. AppHeader mounts two (the
// desktop header and the phone top bar, one hidden by CSS) and remounts on
// every page change, so each bell fetching for itself meant several requests
// per navigation. Now: one request at most every 60s, plus a fresh one
// whenever the bell is opened. Stays empty if the fetch 401s (no session).
type BellState = { notifications: NotificationRow[]; unreadCount: number };
const EMPTY: BellState = { notifications: [], unreadCount: 0 };
const FRESH_FOR_MS = 60_000;
let bellState: BellState = EMPTY;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setBellState(next: BellState) {
  bellState = next;
  listeners.forEach((l) => l());
}

function loadNotifications(force = false): void {
  if (inflight || (!force && Date.now() - fetchedAt < FRESH_FOR_MS)) return;
  inflight = fetch("/api/notifications")
    .then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      fetchedAt = Date.now();
      setBellState({ notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 });
    })
    .catch(() => {
      // Best-effort — an unauthenticated/offline render just shows no bell badge.
    })
    .finally(() => {
      inflight = null;
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default function NotificationBell({ className }: { className?: string }) {
  const t = useT();
  const { notifications, unreadCount } = useSyncExternalStore(subscribe, () => bellState, () => EMPTY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id: number) {
    setBellState({
      notifications: bellState.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, bellState.unreadCount - 1),
    });
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Best-effort — the optimistic local update already reflects the intent.
    }
  }

  async function markAllRead() {
    setBellState({ notifications: bellState.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 });
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // Best-effort.
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          loadNotifications(true);
        }}
        aria-label={t("notification.title")}
        className={className ?? "relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-bg-soft hover:text-foreground"}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          title={t("notification.title")}
          headerRight={
            unreadCount > 0 ? (
              <button onClick={markAllRead} className="text-sm font-semibold text-navy hover:underline">
                {t("notification.markAllRead")}
              </button>
            ) : undefined
          }
        >
          <NotificationList notifications={notifications} onRead={markRead} />
        </Modal>
      )}
    </>
  );
}
