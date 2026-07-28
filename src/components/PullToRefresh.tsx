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
    if (refreshing || window.scrollY > 0) {
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

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        <span
          className={`h-6 w-6 rounded-full border-2 border-navy border-t-transparent transition-opacity ${
            refreshing ? "animate-spin opacity-100" : ready ? "opacity-100" : "opacity-60"
          }`}
          style={!refreshing ? { transform: `rotate(${pull * 3}deg)` } : undefined}
        />
      </div>
      {children}
    </div>
  );
}
