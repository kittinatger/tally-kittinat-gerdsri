"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { loadNotifications, useNotifications } from "@/lib/notification-store";

// The header bell: a link to the Notifications page with an unread badge.
export default function NotificationBell({ className }: { className?: string }) {
  const t = useT();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `${t("notification.title")} (${unreadCount})` : t("notification.title")}
      className={className ?? "relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-bg-soft hover:text-foreground"}
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
