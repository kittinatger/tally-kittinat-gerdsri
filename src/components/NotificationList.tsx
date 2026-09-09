"use client";

import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { useT } from "@/lib/language-context";
import type { NotificationRow } from "@/lib/db";

// Pure/presentational — deliberately split out from NotificationBell so it
// can be exercised with fabricated data (no real session/DB round-trip
// needed), same reasoning as WalletPageView's card-shape components.
export default function NotificationList({
  notifications,
  onRead,
}: {
  notifications: NotificationRow[];
  onRead: (id: number) => void;
}) {
  const router = useRouter();
  const t = useT();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
        <p className="font-semibold text-foreground">{t("notification.empty")}</p>
        <p className="text-sm text-ink-soft">{t("notification.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {notifications.map((n) => (
        <li key={n.id}>
          <button
            onClick={() => {
              if (!n.read) onRead(n.id);
              if (n.url) router.push(n.url);
            }}
            className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-soft"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-navy"}`}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{n.title}</span>
              {n.body && <span className="block truncate text-sm text-ink-soft">{n.body}</span>}
              <span className="block text-xs text-ink-soft/70">{formatRelativeTime(n.created_at)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
