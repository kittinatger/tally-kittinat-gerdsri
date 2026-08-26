"use client";

// The desktop counterpart to CardStack — same item shape (so both can
// render the exact same {key, node, onOpen, ariaLabel} arrays built once
// in WalletPageView), but laid out as a plain grid of full-size cards
// instead of a vertically peeking stack. The peek-stack look is a mobile
// convention (limited width, one card "in front" at a time); on a desktop
// viewport there's enough width to just show every card at once, which
// also means no clipped "peek" strips to keep in sync with card height.
export default function CardGrid({
  items,
}: {
  items: { key: string; node: React.ReactNode; onOpen: () => void; ariaLabel: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onOpen}
          aria-label={item.ariaLabel}
          className="block w-full rounded-2xl text-left shadow-soft transition hover:brightness-105 active:scale-[0.985]"
        >
          {item.node}
        </button>
      ))}
    </div>
  );
}
