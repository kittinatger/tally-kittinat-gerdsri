"use client";

import { useState, type ReactNode } from "react";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

const SLICES = 9;
const SLICE_GAP = 0.9;
const HALF = ((SLICES - 1) / 2) * SLICE_GAP + 0.5;

// A card with a back: tap/click the card (or the Flip button) to turn it
// over with a 3D flip. The front sets the size; the back is laid over it at
// the same size, so any card/pass shape works. Tap rather than hover, since
// hover doesn't exist on phones.
export default function FlipCard({ front, back, label = "card" }: { front: ReactNode; back: ReactNode; label?: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div>
      <div className="[perspective:1200px]">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? `Show front of ${label}` : `Show back of ${label}`}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
          className="relative cursor-pointer rounded-2xl shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] outline-none transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-surface-accent focus-visible:ring-offset-2 motion-reduce:transition-none"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Thickness: a stack of thin dark slices between the two faces,
           * so the card reads as a slab with an edge rather than a sheet
           * of paper. The faces sit on the outer slices. */}
          {Array.from({ length: SLICES }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl bg-neutral-700 dark:bg-neutral-500"
              style={{ transform: `translateZ(${(i - (SLICES - 1) / 2) * SLICE_GAP}px)` }}
            />
          ))}
          <div className="[backface-visibility:hidden]" style={{ transform: `translateZ(${HALF}px)` }} aria-hidden={flipped}>
            {front}
          </div>
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ transform: `rotateY(180deg) translateZ(${HALF}px)` }}
            aria-hidden={!flipped}
          >
            {back}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="mx-auto mt-2.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
      >
        <ArrowsCounterClockwiseIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
        {flipped ? "Show front" : "Flip to see the back"}
      </button>
    </div>
  );
}
