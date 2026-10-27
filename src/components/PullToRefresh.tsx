"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const RESISTANCE = 0.5;
// Refresh itself is near-instant (it's a server component re-render, not a
// network round trip the user waits on), so a fixed settle delay reads
// better than trying to track completion precisely.
const SETTLE_MS = 700;
// How long to keep holding past the pull threshold, without releasing,
// before a release triggers a full page reload instead of a normal
// (data-only) refresh — for when a bigger UI change or update needs a
// fresh JS bundle, not just re-fetched data. Reaching this only *arms*
// the bigger refresh; it still only actually fires on release, same as
// the normal one.
const HOLD_FOR_FULL_REFRESH_MS = 2000;

// The ring's progress arc — a full circle (no caps/gaps) rather than one
// true to PULL_THRESHOLD/MAX_PULL's own ratio, since the handoff from "still
// filling" to "spinning once released" reads clearer as a clean 0%-100%
// sweep than one that visibly stops short of the circle.
const RING_SIZE = 28;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// iOS can report a fractional scroll offset (e.g. 0.5) while sitting at the
// very top, which used to disqualify every pull.
function atTop(): boolean {
  return (document.scrollingElement?.scrollTop ?? window.scrollY) <= 1;
}

export default function PullToRefresh({
  children,
  onRefresh,
}: {
  children: React.ReactNode;
  /** Extra data to reload alongside the server re-render — for pages whose
   * data lives in a client store (e.g. Notifications). */
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  // Whether the current pull has been held past the threshold long enough
  // to release into a full reload instead of a normal refresh.
  const [armedForFull, setArmedForFull] = useState(false);
  // "small" = router.refresh() (re-fetched data, same JS/UI already
  // loaded). "big" = a real window.location.reload().
  const [refreshing, setRefreshing] = useState<"small" | "big" | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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
    onRefresh?.();
    window.setTimeout(() => {
      setRefreshing(null);
      setPull(0);
    }, SETTLE_MS);
  }

  function onTouchStart(e: TouchEvent) {
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
    if (refreshing || !atTop() || (e.target as HTMLElement).closest?.("[data-reorder-item]")) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    setArmedForFull(false);
  }

  function onTouchMove(e: TouchEvent) {
    if (refreshing || !pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0 || !atTop()) {
      pulling.current = false;
      setPull(0);
      setArmedForFull(false);
      clearHoldTimer();
      return;
    }
    // Hold the gesture: otherwise iOS (with overscroll disabled in
    // globals.css) can claim this downward drag at the top of the page and
    // cancel the touch before it's released.
    if (e.cancelable) e.preventDefault();
    const next = Math.min(delta * RESISTANCE, MAX_PULL);
    setPull(next);
    if (next >= PULL_THRESHOLD) {
      if (holdTimer.current === null) {
        holdTimer.current = window.setTimeout(() => {
          holdTimer.current = null;
          setArmedForFull(true);
        }, HOLD_FOR_FULL_REFRESH_MS);
      }
    } else {
      clearHoldTimer();
      setArmedForFull(false);
    }
  }

  function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    startY.current = null;
    const wasReady = pull >= PULL_THRESHOLD;
    clearHoldTimer();
    if (wasReady) {
      triggerRefresh(armedForFull ? "big" : "small");
    } else {
      setPull(0);
    }
    setArmedForFull(false);
  }

  // A cancelled touch (the OS took the gesture, a call came in…) just resets.
  function onTouchCancel() {
    pulling.current = false;
    startY.current = null;
    clearHoldTimer();
    setPull(0);
    setArmedForFull(false);
  }

  // Native listeners rather than React's onTouch* props: React registers
  // touch listeners as passive, and a passive touchmove can't preventDefault.
  // Re-bound every render so they always see the latest state.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  });

  const indicatorHeight = refreshing === "small" ? PULL_THRESHOLD : refreshing === "big" ? MAX_PULL : pull;
  const progress = Math.min(pull / PULL_THRESHOLD, 1);
  const ready = pull >= PULL_THRESHOLD;
  const label = refreshing ? "Refreshing…" : armedForFull ? "Release for a full refresh" : ready ? "Release to refresh" : "Pull to refresh";

  return (
    <div ref={rootRef}>
      <div
        className="flex items-center justify-center gap-2 overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
          {refreshing ? (
            // Same spinner the rest of the app uses for loading states —
            // keeps this feeling like one consistent piece of UI rather
            // than its own bespoke animation.
            <span className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-navy/20 border-t-navy" />
          ) : (
            <>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0 -rotate-90">
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="var(--line)" strokeWidth={RING_STROKE} />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  stroke={armedForFull ? "#d97706" : "var(--navy)"}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                  className="transition-[stroke-dashoffset,stroke] duration-100 ease-out"
                />
              </svg>
              {/* A plain chevron that flips once the pull clears the
               * threshold — "point down to pull, point up to release" is
               * the same motif most native pull-to-refresh uses, clearer
               * at a glance than a refresh glyph spinning proportionally
               * to how far a finger has moved. */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={armedForFull ? "#d97706" : "var(--navy)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ transform: `rotate(${ready ? 180 : 0}deg)` }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </div>
        <span className={`truncate text-xs font-semibold ${ready || refreshing ? "text-foreground" : "text-ink-soft"}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}
