"use client";

import { useSyncExternalStore } from "react";
import type { NotificationRow } from "@/lib/db";

// One shared store for the bell badges (AppHeader mounts two — desktop and
// phone — and remounts on every page change) and the Notifications page, so
// marking something read on the page clears the badge straight away. Fetches
// at most every 60s unless forced. Stays empty if the fetch 401s.
type State = { notifications: NotificationRow[]; unreadCount: number; loaded: boolean };
const EMPTY: State = { notifications: [], unreadCount: 0, loaded: false };
const FRESH_FOR_MS = 60_000;
let state: State = EMPTY;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotifications(): State {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function loadNotifications(force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && Date.now() - fetchedAt < FRESH_FOR_MS) return Promise.resolve();
  inflight = fetch("/api/notifications")
    .then(async (res) => {
      if (!res.ok) return set({ ...state, loaded: true });
      const data = await res.json();
      fetchedAt = Date.now();
      set({ notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0, loaded: true });
    })
    .catch(() => {
      // Best-effort — offline/unauthenticated just shows no badge (and the
      // page its empty state rather than a skeleton forever).
      set({ ...state, loaded: true });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function markNotificationRead(id: number) {
  const target = state.notifications.find((n) => n.id === id);
  if (!target || target.read) return;
  set({
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    unreadCount: Math.max(0, state.unreadCount - 1),
  });
  await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
}

export async function markAllNotificationsRead() {
  set({ ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 });
  await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
}

export async function deleteNotification(id: number) {
  const target = state.notifications.find((n) => n.id === id);
  set({
    ...state,
    notifications: state.notifications.filter((n) => n.id !== id),
    unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
  });
  await fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
}
