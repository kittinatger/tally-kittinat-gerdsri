"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 600;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates a numeric value toward `target` whenever it changes, for the
 * headline currency figures across the Analytics page (net worth, income,
 * expenses, ...). Initializes to `target` itself rather than 0 — so the
 * server-rendered markup and the first client render show the exact same
 * text and there's no hydration mismatch, and no flash-of-zero on initial
 * page load. Only *subsequent* changes (switching the period, editing your
 * balance) animate, which is the more meaningful moment for motion anyway.
 */
export function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      // First mount — already showing `target` from useState's initializer.
      mountedRef.current = true;
      fromRef.current = target;
      return;
    }
    if (target === fromRef.current) return;

    const from = fromRef.current;
    const delta = target - from;
    const start = performance.now();
    // Reduced-motion jumps straight to the target — modeled as a
    // zero-duration animation (t=1 on the very first tick) so the
    // setState still happens inside the rAF callback below rather than
    // synchronously in the effect body.
    const duration = prefersReducedMotion() ? 0 : DURATION_MS;

    function tick(now: number) {
      const elapsed = now - start;
      const t = duration <= 0 ? 1 : Math.min(1, elapsed / duration);
      setDisplay(from + delta * easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return display;
}
