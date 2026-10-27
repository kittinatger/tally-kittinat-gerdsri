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
// One shell, two fills rather than two unrelated screens: a soft pulsing
// glow behind a rounded tile, the wordmark, and an indeterminate progress
// bar, all pure CSS (no JS-driven animation, nothing to schedule before
// first paint matters here). Online, the tile holds the real favicon-*.svg
// logo — worth the wait since a real page is genuinely on its way over the
// network too, so this splash isn't racing anything. Offline, there's no
// page coming — this *is* as far as the load gets, possibly for a while —
// so the tile holds a plain CSS dot instead: the favicon-*.svg files are a
// full illustration (megabytes of path data), not a simple icon, and would
// otherwise sit there failing/stalling to load with nothing to show for it.
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

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 px-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-[loading-pulse_1.8s_ease-in-out_infinite] rounded-2xl bg-navy/30 blur-xl motion-reduce:animate-none motion-reduce:opacity-60"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-soft">
          {online ? (
            <>
              <img src="/favicon-light.svg" alt="" className="h-8 w-8 dark:hidden" />
              <img src="/favicon-dark.svg" alt="" className="hidden h-8 w-8 dark:block" />
            </>
          ) : (
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-[loading-pulse_1.2s_ease-in-out_infinite] rounded-full bg-navy motion-reduce:animate-none"
            />
          )}
        </div>
      </div>
      <p className="font-display text-lg text-foreground">Tally</p>
      <div className="h-1 w-28 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 animate-[loading-bar-sweep_1.3s_ease-in-out_infinite] rounded-full bg-navy motion-reduce:hidden" />
      </div>
    </div>
  );
}
