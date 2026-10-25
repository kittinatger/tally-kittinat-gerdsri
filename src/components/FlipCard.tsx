"use client";

import { useState, type ReactNode } from "react";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

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
          className="relative cursor-pointer outline-none transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-surface-accent focus-visible:ring-offset-2 motion-reduce:transition-none"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="[backface-visibility:hidden]" aria-hidden={flipped}>
            {front}
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!flipped}>
            {back}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="mx-auto mt-2.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
      >
        <ArrowsCounterClockwiseIcon weight="bold" aria-hidden="true" className="h-3.5 w-3.5" />
        {flipped ? "Show front" : "Flip to see the back"}
      </button>
    </div>
  );
}
