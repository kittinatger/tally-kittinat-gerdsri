"use client";

// A vertical stack of card-shaped items where every item but the last is
// clipped down to a "peek" strip (just its header, ~64px) tucked slightly
// under the one above it — the classic Apple Wallet look. The last item
// renders at full height, lifted with a stronger shadow so it visibly
// "pops out" in front of the stack rather than just sitting flush below
// it. Tapping any item, peeking or not, opens it (the caller decides what
// "open" means per item) — matches how tapping a peeking card in the real
// Wallet app also opens it straight to detail, rather than just bringing
// it to the front in place.
export default function CardStack({
  items,
}: {
  items: { key: string; node: React.ReactNode; onOpen: () => void; ariaLabel: string }[];
}) {
  return (
    <div>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onOpen}
            aria-label={item.ariaLabel}
            style={{ marginTop: i === 0 ? 0 : isLast ? -16 : -8, zIndex: i + 1 }}
            className={`relative block w-full origin-top text-left transition active:scale-[0.985] ${
              isLast
                ? "rounded-2xl shadow-[0_18px_30px_-12px_rgba(0,0,0,0.35)] hover:brightness-105"
                : "h-16 overflow-hidden rounded-t-2xl shadow-[0_-6px_10px_-8px_rgba(0,0,0,0.25)] hover:brightness-105"
            }`}
          >
            {item.node}
          </button>
        );
      })}
    </div>
  );
}
