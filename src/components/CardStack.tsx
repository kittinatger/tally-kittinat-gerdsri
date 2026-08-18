"use client";

// A vertical stack of card-shaped items where every item but the last is
// clipped down to a "peek" strip (just its header, ~56px) stacked directly
// under the one above — the classic Apple Wallet look. The last item renders
// at full height, tucked slightly under the peek above it. Tapping any
// item, peeking or not, opens it (the caller decides what "open" means per
// item) — matches how tapping a peeking card in the real Wallet app also
// opens it straight to detail, rather than just bringing it to the front.
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
            style={isLast ? { marginTop: -10 } : undefined}
            className={`relative block w-full text-left transition hover:brightness-105 ${
              isLast ? "" : "h-14 overflow-hidden rounded-t-2xl"
            }`}
          >
            {item.node}
          </button>
        );
      })}
    </div>
  );
}
