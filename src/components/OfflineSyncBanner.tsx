"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeQueueState, type QueueState } from "@/lib/offline/sync-manager";
import { useT } from "@/lib/language-context";

export default function OfflineSyncBanner() {
  const t = useT();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [queue, setQueue] = useState<QueueState>({ pending: 0, failed: 0, syncing: false });

  useEffect(() => {
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const unsubscribe = subscribeQueueState(setQueue);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsubscribe();
    };
  }, []);

  const nothingToShow = online && queue.pending === 0 && queue.failed === 0 && !queue.syncing;
  if (nothingToShow) return null;

  const label = !online
    ? queue.pending > 0
      ? t("offline.banner.offlineQueued").replace("{count}", String(queue.pending))
      : t("offline.banner.offline")
    : queue.syncing
      ? t("offline.banner.syncing").replace("{count}", String(queue.pending))
      : queue.failed > 0
        ? t("offline.banner.failed").replace("{count}", String(queue.failed))
        : t("offline.banner.synced");

  const hasQueue = queue.pending > 0 || queue.failed > 0;
  const pillClassName = `flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur ${
    queue.failed > 0
      ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-800 dark:bg-red-950/90 dark:text-red-300"
      : !online
        ? "border-amber-300 bg-amber-50/95 text-amber-700 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-300"
        : "border-line bg-surface/95 text-foreground"
  } ${hasQueue ? "cursor-pointer hover:opacity-90" : ""}`;
  const dot = <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${!online ? "bg-amber-500" : queue.failed > 0 ? "bg-red-500" : "bg-emerald-500"}`} />;

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-40 flex justify-center px-4 sm:bottom-4">
      {/* Only a real link once there's something to review — a fleeting
       * "All changes synced" toast shouldn't be tappable to anywhere. */}
      {hasQueue ? (
        <Link href="/settings?panel=pendingChanges" className={pillClassName}>
          {dot}
          {label}
        </Link>
      ) : (
        <div className={pillClassName}>
          {dot}
          {label}
        </div>
      )}
    </div>
  );
}
