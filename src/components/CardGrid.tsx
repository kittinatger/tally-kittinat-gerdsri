"use client";

import { useReorderableList } from "@/lib/use-reorderable-list";

// The desktop counterpart to CardStack — same item shape (so both can
// render the exact same {key, node, onOpen, ariaLabel} arrays built once
// in WalletPageView), but laid out as a plain grid of full-size cards
// instead of a vertically peeking stack. The peek-stack look is a mobile
// convention (limited width, one card "in front" at a time); on a desktop
// viewport there's enough width to just show every card at once, which
// also means no clipped "peek" strips to keep in sync with card height.
//
// `onReorder` arms the same click-and-hold-to-drag as CardStack — see the
// shared hook for the actual gesture logic, which is layout-agnostic
// (DOM-rect hit-testing rather than an assumed axis), so it works
// unchanged for this 2D grid.
export default function CardGrid({
  items,
  onReorder,
}: {
  items: { key: string; node: React.ReactNode; onOpen: () => void; ariaLabel: string }[];
  onReorder?: (orderedKeys: string[]) => void;
}) {
  const { orderedItems, draggingKey, dragOffset, registerElement, getHandlers } = useReorderableList(items, onReorder);

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {orderedItems.map((item) => {
        const isDragging = draggingKey === item.key;
        return (
          <button
            key={item.key}
            ref={registerElement(item.key)}
            type="button"
            {...getHandlers(item.key, item.onOpen)}
            aria-label={item.ariaLabel}
            style={{
              zIndex: isDragging ? 50 : undefined,
              transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.04)` : undefined,
              transition: isDragging ? "none" : "transform 0.15s ease",
            }}
            className={`relative block w-full select-none rounded-2xl text-left active:scale-[0.985] ${
              isDragging ? "cursor-grabbing shadow-[0_24px_40px_-16px_rgba(0,0,0,0.45)]" : "cursor-pointer shadow-soft hover:brightness-105"
            }`}
          >
            {item.node}
          </button>
        );
      })}
    </div>
  );
}
