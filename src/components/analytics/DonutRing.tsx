"use client";

import { useEffect, useState } from "react";

export type DonutSegment = { label: string; value: number; colorClass: string };

const SIZE = 120;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

// A small composition ring — e.g. "wallets by balance" on the Analytics
// page's desktop layout. Built from stacked <circle> arcs via
// stroke-dasharray/stroke-dashoffset rather than SpendingTrendChart's
// path-based pie (simpler for a plain ring, and this needs a hole in the
// middle for a center label). Draws itself in on mount: starts at zero
// length, then transitions to the real segment lengths once mounted, via
// CSS transition rather than a JS animation loop.
export default function DonutRing({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  let cumulative = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-28 w-28 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-[var(--line)]" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const fraction = s.value / total;
              const length = fraction * CIRCUMFERENCE;
              const offset = drawn ? CIRCUMFERENCE - length : CIRCUMFERENCE;
              const rotation = (cumulative / total) * 360;
              cumulative += s.value;
              return (
                <circle
                  key={s.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  className={`${s.colorClass} transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none`}
                  style={{ transformOrigin: "50% 50%", transform: `rotate(${rotation}deg)` }}
                />
              );
            })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute flex flex-col items-center">
          {centerValue && <span className="font-display text-sm text-surface-foreground">{centerValue}</span>}
          {centerLabel && <span className="text-[10px] text-surface-foreground-soft">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
