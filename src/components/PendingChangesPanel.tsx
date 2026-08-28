"use client";

import { useEffect, useState } from "react";
import { subscribeQueueState, flushQueue, retryFailed, discardFailed } from "@/lib/offline/sync-manager";
import { listQueuedMutations, type QueuedMutation } from "@/lib/offline/mutation-queue";
import { useT } from "@/lib/language-context";

// A short, human-readable label for what a queued request actually is —
// callers of mutateFetch() never had to describe themselves, so this
// reverse-engineers something reasonable from method + URL rather than
// requiring every call site to carry an extra description field.
function describeMutation(m: QueuedMutation): string {
  const path = m.url.replace(/^\/api\//, "").split("?")[0];
  const verb = m.method === "DELETE" ? "Delete" : m.method === "POST" ? "Create" : "Update";
  return `${verb} — ${path}`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function PendingChangesPanel() {
  const t = useT();
  const [items, setItems] = useState<QueuedMutation[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setItems(await listQueuedMutations());
  }

  useEffect(() => {
    // load()'s own setItems(...) is what this effect exists to trigger —
    // same fetch-on-mount pattern used elsewhere (e.g. AppLockSettingsPanel.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // Queue state (pending/failed counts) changes are already broadcast by
    // sync-manager.ts for the banner — piggyback on the same subscription
    // to know when to reload the actual item list too.
    const unsubscribe = subscribeQueueState(() => {
      load();
    });
    return unsubscribe;
  }, []);

  async function handleRetry(id: number) {
    setBusyId(id);
    try {
      await retryFailed(id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDiscard(id: number) {
    setBusyId(id);
    try {
      await discardFailed(id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const pending = items?.filter((m) => m.status === "pending") ?? [];
  const failed = items?.filter((m) => m.status === "failed") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display text-2xl text-foreground">{t("pendingChanges.title")}</h3>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{t("pendingChanges.description")}</p>
      </div>

      {items === null ? (
        <p className="text-xs text-ink-soft">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">{t("pendingChanges.empty")}</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  {t("pendingChanges.pendingTitle")} ({pending.length})
                </h4>
                <button
                  type="button"
                  onClick={() => void flushQueue()}
                  className="text-xs font-semibold text-surface-accent hover:underline"
                >
                  {t("pendingChanges.syncNow")}
                </button>
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {pending.map((m) => (
                  <li key={m.id} className="rounded-input border border-line px-3 py-2">
                    <p className="text-xs font-medium text-foreground">{describeMutation(m)}</p>
                    <p className="text-[11px] text-ink-soft">{formatTime(m.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {failed.length > 0 && (
            <section className="rounded-card border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/10">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                {t("pendingChanges.failedTitle")} ({failed.length})
              </h4>
              <ul className="mt-2 flex flex-col gap-2">
                {failed.map((m) => (
                  <li key={m.id} className="rounded-input border border-line bg-surface px-3 py-2.5">
                    <p className="text-xs font-medium text-foreground">{describeMutation(m)}</p>
                    <p className="text-[11px] text-ink-soft">{formatTime(m.createdAt)}</p>
                    {m.lastError && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{m.lastError}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => m.id !== undefined && handleRetry(m.id)}
                        className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
                      >
                        {t("pendingChanges.retry")}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => m.id !== undefined && handleDiscard(m.id)}
                        className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
                      >
                        {t("pendingChanges.discard")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
