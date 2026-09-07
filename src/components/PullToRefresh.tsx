"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const RESISTANCE = 0.5;
// Refresh itself is near-instant (it's a server component re-render, not a
// network round trip the user waits on), so a fixed settle delay reads
// better than trying to track completion precisely.
const SETTLE_MS = 700;
// How long to keep holding past the pull threshold, without releasing,
// before this upgrades from a normal (data-only) refresh into a full page
// reload — for when a bigger UI change or update needs a fresh JS bundle,
// not just re-fetched data.
const HOLD_FOR_FULL_REFRESH_MS = 2000;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  // "small" = router.refresh() (re-fetched data, same JS/UI already
  // loaded). "big" = a real window.location.reload() — a normal release
  // only ever produces "small"; holding past the threshold for
  // HOLD_FOR_FULL_REFRESH_MS upgrades to "big" on its own, without
  // waiting for release.
  const [refreshing, setRefreshing] = useState<"small" | "big" | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const holdTimer = useRef<number | null>(null);

  function clearHoldTimer() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  useEffect(() => clearHoldTimer, []);

  function triggerRefresh(kind: "small" | "big") {
    clearHoldTimer();
    setRefreshing(kind);
    if (kind === "big") {
      // The page is about to unload — no need to reset any state here.
      window.location.reload();
      return;
    }
    router.refresh();
    window.setTimeout(() => {
      setRefreshing(null);
      setPull(0);
    }, SETTLE_MS);
  }

  function onTouchStart(e: React.TouchEvent) {
    // A card armed for click-and-hold-to-drag (see use-reorderable-list.ts)
    // sits inside this wrapper, and touch events aren't stopped by that
    // card's own touch-action: none — that CSS property only suppresses
    // the browser's native scrolling, not React's independent onTouchMove
    // handlers here, which keep firing (and re-rendering this whole
    // component on every frame) throughout the same physical gesture. Left
    // unchecked, that competing pull-tracking made a long-press feel like
    // it barely registered and any successful drag feel janky, since both
    // gestures were fighting over the same touch the entire time. Any
    // touch starting on a reorderable card skips pull-to-refresh tracking
    // entirely instead.
    if (refreshing || window.scrollY > 0 || (e.target as HTMLElement).closest?.("[data-reorder-item]")) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (refreshing || !pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0 || window.scrollY > 0) {
      pulling.current = false;
      setPull(0);
      clearHoldTimer();
      return;
    }
    const next = Math.min(delta * RESISTANCE, MAX_PULL);
    setPull(next);
    if (next >= PULL_THRESHOLD) {
      if (holdTimer.current === null) {
        holdTimer.current = window.setTimeout(() => triggerRefresh("big"), HOLD_FOR_FULL_REFRESH_MS);
      }
    } else {
      clearHoldTimer();
    }
  }

  function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    startY.current = null;
    const wasReady = pull >= PULL_THRESHOLD;
    const wasHoldingForBig = holdTimer.current !== null;
    clearHoldTimer();
    if (wasReady && wasHoldingForBig) {
      // Released before the hold timer fired — a normal (small) refresh.
      triggerRefresh("small");
    } else if (!wasReady) {
      setPull(0);
    }
    // Otherwise the hold timer already fired mid-gesture and started a
    // "big" refresh — nothing left to do here.
  }

  const indicatorHeight = refreshing ? PULL_THRESHOLD : pull;
  const ready = pull >= PULL_THRESHOLD;
  const label = ready ? "Release to refresh · keep holding for a full refresh" : "Pull to refresh";

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {!refreshing && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: indicatorHeight }}
          aria-hidden={indicatorHeight === 0}
        >
          <div className="flex max-w-[85vw] items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3.5 py-2 shadow-soft backdrop-blur-xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              className="h-5 w-5 shrink-0 text-navy transition-transform"
              style={{ transform: `rotate(${Math.min(pull * 3.5, 360)}deg)` }}
            >
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v5h-5" />
            </svg>
            <span className={`truncate text-xs font-semibold ${ready ? "text-foreground" : "text-ink-soft"}`}>{label}</span>
          </div>
        </div>
      )}
      {refreshing && (
        <div className="fixed inset-0 z-50 bg-background">
          <LoadingScreen />
        </div>
      )}
      {children}
    </div>
  );
}
