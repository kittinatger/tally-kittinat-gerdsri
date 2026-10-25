"use client";

import { useState, type ReactNode } from "react";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

// Fewer, wider-spaced slices than a first pass used (9 at 0.9px) — same
// total depth, half the extra DOM nodes/compositing layers per card.
const SLICES = 5;
const SLICE_GAP = 1.6;
const HALF = ((SLICES - 1) / 2) * SLICE_GAP + 0.5;

// A card with a back: tap/click the card (or the Flip button) to turn it
// over with a 3D flip. The front sets the size; the back is laid over it at
// the same size, so any card/pass shape works. Tap rather than hover, since
// hover doesn't exist on phones.
//
// Controlled mode: pass `flipped` to drive the turn from outside (e.g. a
// tab switch in the add/edit form) instead of a click. Pair it with
// `interactive={false}` to drop the click/keyboard handling and the Flip
// button, since whatever sets `flipped` is already the control for it.
export default function FlipCard({
  front,
  back,
  label = "card",
  flipped: flippedProp,
  interactive = true,
}: {
  front: ReactNode;
  back: ReactNode;
  label?: string;
  flipped?: boolean;
  interactive?: boolean;
}) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = flippedProp ?? internalFlipped;
  const toggle = () => setInternalFlipped((v) => !v);

  return (
    <div>
      <div className="[perspective:1200px]">
        <div
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-pressed={interactive ? flipped : undefined}
          aria-label={interactive ? (flipped ? `Show front of ${label}` : `Show back of ${label}`) : undefined}
          onClick={interactive ? toggle : undefined}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }
              : undefined
          }
          className={`relative rounded-2xl outline-none transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-surface-accent focus-visible:ring-offset-2 motion-reduce:transition-none ${interactive ? "cursor-pointer" : ""}`}
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
      {interactive && (
        <button
          type="button"
          onClick={toggle}
          className="mx-auto mt-2.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
        >
          <ArrowsCounterClockwiseIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
          {flipped ? "Show front" : "Flip to see the back"}
        </button>
      )}
    </div>
  );
}
