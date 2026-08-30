"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const RESISTANCE = 0.5;
// Refresh itself is near-instant (it's a server component re-render, not a
// network round trip the user waits on), so a fixed settle delay reads
// better than trying to track completion precisely.
const SETTLE_MS = 700;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

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
    if (!pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0 || window.scrollY > 0) {
      pulling.current = false;
      setPull(0);
      return;
    }
    setPull(Math.min(delta * RESISTANCE, MAX_PULL));
  }

  function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    startY.current = null;
    if (pull >= PULL_THRESHOLD) {
      setRefreshing(true);
      router.refresh();
      window.setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, SETTLE_MS);
    } else {
      setPull(0);
    }
  }

  const indicatorHeight = refreshing ? PULL_THRESHOLD : pull;
  const ready = pull >= PULL_THRESHOLD;
  const label = refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull to refresh";

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3.5 py-2 shadow-soft backdrop-blur-xl">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            className={`h-5 w-5 shrink-0 text-navy transition-transform ${refreshing ? "animate-spin" : ""}`}
            style={!refreshing ? { transform: `rotate(${Math.min(pull * 3.5, 360)}deg)` } : undefined}
          >
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v5h-5" />
          </svg>
          <span className={`text-xs font-semibold ${ready || refreshing ? "text-foreground" : "text-ink-soft"}`}>
            {label}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
