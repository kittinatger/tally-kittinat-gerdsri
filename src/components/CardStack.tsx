"use client";

import { useReorderableList } from "@/lib/use-reorderable-list";

// A vertical stack of card-shaped items where every item but the last is
// clipped down to a "peek" strip (just its header, ~64px) tucked slightly
// under the one above it — the classic Apple Wallet look. The last item
// renders at full height, lifted with a stronger shadow so it visibly
// "pops out" in front of the stack rather than just sitting flush below
// it. Tapping any item, peeking or not, opens it (the caller decides what
// "open" means per item) — matches how tapping a peeking card in the real
// Wallet app also opens it straight to detail, rather than just bringing
// it to the front in place.
//
// Passing `onReorder` arms click-and-hold-to-drag: hold an item ~400ms,
// then drag it to a new position (swaps live as you cross another item's
// bounds) and release to drop it there, firing `onReorder` with the final
// key order. Omit it and every item is a plain tappable button, same as
// before this existed — used for the wallets/cards stack, not the
// passes/memberships one below it.
export default function CardStack({
  items,
  onReorder,
}: {
  items: { key: string; node: React.ReactNode; onOpen: () => void; ariaLabel: string }[];
  onReorder?: (orderedKeys: string[]) => void;
}) {
  const { orderedItems, draggingKey, dragOffset, registerElement, getHandlers, reorderable } = useReorderableList(items, onReorder);

  return (
    <div>
      {orderedItems.map((item, i) => {
        const isLast = i === orderedItems.length - 1;
        const isDragging = draggingKey === item.key;
        return (
          <button
            key={item.key}
            ref={registerElement(item.key)}
            type="button"
            {...getHandlers(item.key, item.onOpen)}
            aria-label={item.ariaLabel}
            // Lets PullToRefresh (an ancestor wrapping this whole stack)
            // recognize and skip touches that start on a reorderable card
            // — see its own comment for why that matters.
            {...(reorderable ? { "data-reorder-item": "" } : {})}
            style={{
              marginTop: i === 0 ? 0 : isLast ? -16 : -8,
              zIndex: isDragging ? 50 : i + 1,
              // pan-y lets the page scroll normally through a quick swipe or
              // while the long-press timer is still pending. The hook
              // itself flips this to "none" imperatively, directly on the
              // DOM node, the instant a long-press actually arms (see
              // use-reorderable-list.ts) — this style prop just keeps
              // React's own idea of the value in sync on the next render,
              // it isn't what actually stops the scroll in time.
              touchAction: isDragging ? "none" : reorderable ? "pan-y" : undefined,
              transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.03)` : undefined,
              transition: isDragging ? "none" : "transform 0.15s ease, margin-top 0.15s ease",
            }}
            className={`relative block w-full origin-top select-none text-left active:scale-[0.985] ${
              isDragging ? "cursor-grabbing shadow-[0_24px_40px_-16px_rgba(0,0,0,0.45)]" : "cursor-pointer"
            } ${
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
