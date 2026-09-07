"use client";

import { useEffect, useState } from "react";

// The one loading state every route uses — a full-screen branded splash
// rather than a skeleton mimicking the eventual layout. Originally built
// for the home route's cold-start load (see the comment that used to live
// here, now on every route.tsx using this: a fresh tab/PWA launch/hard
// refresh reads better as "the app is starting up" than as a placeholder
// for content about to resolve into place) and since extended to every
// route's loading.tsx, replacing what were previously per-page skeletons —
// per explicit product direction, no skeleton placeholders anywhere, full
// consistency over mimicking each page's eventual shape.
//
// Two designs depending on connectivity: online, the real favicon-*.svg
// logo is worth the wait (see below) since a real page is genuinely on
// its way over the network too, so this splash isn't racing anything.
// Offline, there's no page coming — this *is* as far as the load gets,
// possibly for a while — so it falls back to the pure CSS/text version
// with zero network dependency, since the favicon-*.svg files are a
// full illustration (megabytes of path data), not a simple icon, and
// would otherwise sit there failing/stalling to load with nothing to
// show for it.
export default function LoadingScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-4">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
        <p className="font-display text-lg text-foreground">Tally</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
        <img src="/favicon-light.svg" alt="" className="h-8 w-8 dark:hidden" />
        <img src="/favicon-dark.svg" alt="" className="hidden h-8 w-8 dark:block" />
      </div>
      <p className="font-display text-lg text-foreground">Tally</p>
    </div>
  );
}
