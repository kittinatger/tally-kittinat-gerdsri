"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

const FLIP_MS = 700;
const EASE = "cubic-bezier(0.4,0.2,0.2,1)";
// Resting shadow, and the deeper one while the card is in the air.
const SHADOW_REST = "drop-shadow(0 3px 4px rgba(0,0,0,0.18)) drop-shadow(0 8px 14px rgba(0,0,0,0.14))";
const SHADOW_LIFT = "drop-shadow(0 14px 10px rgba(0,0,0,0.16)) drop-shadow(0 30px 34px rgba(0,0,0,0.32))";

// A card with a back: tap/click the card (or the Flip button) to turn it
// over with a 3D flip. The front sets the size; the back is laid over it at
// the same size, so any card/pass shape works. Tap rather than hover, since
// hover doesn't exist on phones.
//
// Depth: mid-flip the card lifts toward the viewer and its shadow deepens,
// then settles back down on the table as it lands. Driven by the Web
// Animations API so the whole path is one animation, not two transitions.
export default function FlipCard({ front, back, label = "card" }: { front: ReactNode; back: ReactNode; label?: string }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    const shadow = shadowRef.current;
    if (!card || !shadow) return;

    const from = flipped ? 0 : 180;
    const to = flipped ? 180 : 0;
    const options: KeyframeAnimationOptions = { duration: FLIP_MS, easing: EASE };
    card.animate(
      [
        { transform: `rotateY(${from}deg) translateZ(0px)` },
        { transform: `rotateY(${(from + to) / 2}deg) translateZ(56px)`, offset: 0.5 },
        { transform: `rotateY(${to}deg) translateZ(0px)` },
      ],
      options,
    );
    shadow.animate(
      [
        { filter: SHADOW_REST },
        { filter: SHADOW_LIFT, offset: 0.5 },
        { filter: SHADOW_REST },
      ],
      options,
    );
  }, [flipped]);

  return (
    <div>
      <div className="[perspective:1200px]">
        <div ref={shadowRef} style={{ filter: SHADOW_REST }}>
          <div
            ref={cardRef}
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
            className="relative cursor-pointer outline-none [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-surface-accent focus-visible:ring-offset-2"
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
