"use client";

import { useEffect } from "react";
import { startSyncManager } from "@/lib/offline/sync-manager";
import OfflineSyncBanner from "./OfflineSyncBanner";

// Mounted once, high in the tree (root layout) — starts the sync manager's
// online-event listener and renders the persistent status banner. Doesn't
// wrap children in any provider/context; OfflineSyncBanner reads queue
// state directly via subscribeQueueState (see sync-manager.ts) rather than
// through React context, since nothing else in the tree needs that state.
export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startSyncManager();
  }, []);

  return (
    <>
      {children}
      <OfflineSyncBanner />
    </>
  );
}
