"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BellIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { NotificationRow } from "@/lib/db";

const Modal = dynamic(() => import("./Modal"));
const NotificationList = dynamic(() => import("./NotificationList"));

// Self-fetches on mount, same pattern as NavStyleProvider/IconStyleSync —
// silently stays empty if the fetch 401s (no session in this render
// context) rather than surfacing an error.
export default function NotificationBell({ className }: { className?: string }) {
  const t = useT();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Best-effort — an unauthenticated/offline render just shows no bell badge.
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  async function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Best-effort — the optimistic local update already reflects the intent.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
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
          refresh();
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
