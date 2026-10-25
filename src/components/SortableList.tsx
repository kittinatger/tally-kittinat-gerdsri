"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr";

type Id = string | number;

export type SortableItemContext = {
  /** The grip button — place it where the row's drag handle should sit. */
  handle: ReactNode;
  /** Position in the current (possibly mid-drag) order. */
  index: number;
  dragging: boolean;
};

// Drag-to-reorder for Settings lists (wallets, savings goals, recurring
// rules): grab a row by its grip handle and drag — it follows the pointer
// exactly while the other rows slide out of the way (FLIP animation), and
// the new order is reported once on release. Works for a vertical list or a
// grid (hit-testing is by rectangle). Arrow keys on a focused handle move a
// row one step. Rows without a handle (canReorder false) stay put relative
// to each other's order but can still be passed over.
export default function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  canReorder = () => true,
  handleLabel,
  className,
  itemClassName = "",
}: {
  items: T[];
  getId: (item: T) => Id;
  onReorder: (orderedIds: Id[]) => void;
  renderItem: (item: T, ctx: SortableItemContext) => ReactNode;
  canReorder?: (item: T) => boolean;
  handleLabel: (item: T) => string;
  className?: string;
  itemClassName?: string;
}) {
  const [order, setOrder] = useState<Id[]>(() => items.map(getId));
  const [draggingId, setDraggingId] = useState<Id | null>(null);
  // Re-sync from the caller when its list changes (but never mid-drag).
  const signature = items.map(getId).join(",");
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature && draggingId === null) {
    setPrevSignature(signature);
    setOrder(items.map(getId));
  }

  const elements = useRef(new Map<Id, HTMLElement>());
  // Mirrors `order` for pointer handlers (synced in the layout effect below,
  // and immediately by move()).
  const orderRef = useRef(order);
  const drag = useRef<{ id: Id; grabX: number; grabY: number; pointerX: number; pointerY: number } | null>(null);
  // Rects captured just before a reorder, for the FLIP slide of the others.
  const before = useRef<Map<Id, DOMRect> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Where a row sits in the layout, ignoring any transform — so a row that's
  // mid-slide (FLIP) is hit-tested at its real spot, not where it's drawn,
  // which otherwise swapped rows straight back as they animated past.
  function layoutRect(el: HTMLElement) {
    const c = containerRef.current!.getBoundingClientRect();
    const left = c.left + el.offsetLeft;
    const top = c.top + el.offsetTop;
    return { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight };
  }

  function rectsNow(): Map<Id, DOMRect> {
    const m = new Map<Id, DOMRect>();
    for (const [id, el] of elements.current) m.set(id, el.getBoundingClientRect());
    return m;
  }

  // Positions the dragged row under the pointer: its natural (untransformed)
  // spot plus whatever offset keeps the grab point under the finger.
  function placeDragged() {
    const d = drag.current;
    if (!d) return;
    const el = elements.current.get(d.id);
    if (!el) return;
    el.style.transform = "";
    const natural = el.getBoundingClientRect();
    el.style.transform = `translate(${d.pointerX - d.grabX - natural.left}px, ${d.pointerY - d.grabY - natural.top}px)`;
  }

  useLayoutEffect(() => {
    orderRef.current = order;
    const prev = before.current;
    before.current = null;
    if (prev) {
      for (const [id, el] of elements.current) {
        if (drag.current && id === drag.current.id) continue;
        const was = prev.get(id);
        if (!was) continue;
        const now = el.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (!dx && !dy) continue;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 200ms ease";
          el.style.transform = "";
        });
      }
    }
    placeDragged();
  }, [order]);

  function move(id: Id, toIndex: number) {
    const current = orderRef.current;
    const from = current.indexOf(id);
    if (from === -1 || toIndex === from || toIndex < 0 || toIndex >= current.length) return null;
    const next = current.slice();
    next.splice(from, 1);
    next.splice(toIndex, 0, id);
    before.current = rectsNow();
    orderRef.current = next;
    setOrder(next);
    return next;
  }

  function onPointerDown(e: React.PointerEvent, id: Id) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = elements.current.get(id);
    if (!el) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    drag.current = { id, grabX: e.clientX - rect.left, grabY: e.clientY - rect.top, pointerX: e.clientX, pointerY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    el.style.transition = "none";
    setDraggingId(id);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    d.pointerX = e.clientX;
    d.pointerY = e.clientY;
    placeDragged();
    // Swap with whichever row the pointer is well inside vertically (a 25%
    // dead zone at the top/bottom stops back-and-forth flicker on a shared
    // border). Horizontally only a few pixels — the grip sits at a row's
    // far left, so a wide margin there would never let a list swap.
    for (const [id, el] of elements.current) {
      if (id === d.id) continue;
      const r = layoutRect(el);
      const mx = Math.min(8, r.width * 0.1);
      const my = r.height * 0.25;
      if (e.clientX > r.left + mx && e.clientX < r.right - mx && e.clientY > r.top + my && e.clientY < r.bottom - my) {
        move(d.id, orderRef.current.indexOf(id));
        break;
      }
    }
  }

  function endDrag(commit: boolean) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const el = elements.current.get(d.id);
    if (el) {
      el.style.transition = "transform 180ms ease";
      el.style.transform = "";
    }
    setDraggingId(null);
    const original = items.map(getId);
    if (!commit) {
      setOrder(original);
      return;
    }
    if (orderRef.current.join(",") !== original.join(",")) onReorder(orderRef.current);
  }

  function onKeyDown(e: React.KeyboardEvent, id: Id) {
    const delta = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = move(id, orderRef.current.indexOf(id) + delta);
    if (next) onReorder(next);
  }

  const byId = new Map(items.map((item) => [getId(item), item]));
  return (
    // Positioned so it's every row's offsetParent (see layoutRect).
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {order.map((id, index) => {
        const item = byId.get(id);
        if (item === undefined) return null;
        const dragging = draggingId === id;
        const handle = canReorder(item) ? (
          <button
            type="button"
            aria-label={handleLabel(item)}
            onPointerDown={(e) => onPointerDown(e, id)}
            onPointerMove={onPointerMove}
            onPointerUp={() => endDrag(true)}
            onPointerCancel={() => endDrag(false)}
            onKeyDown={(e) => onKeyDown(e, id)}
            className={`flex h-8 w-6 shrink-0 touch-none items-center justify-center rounded-md text-ink-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-accent ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <DotsSixVerticalIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        );
        return (
          <div
            key={id}
            ref={(el) => {
              if (el) elements.current.set(id, el);
              else elements.current.delete(id);
            }}
            className={`${itemClassName} ${dragging ? "relative z-20 rounded-card bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.18)] ring-1 ring-surface-accent/40" : "relative"}`}
          >
            {renderItem(item, { handle, index, dragging })}
          </div>
        );
      })}
    </div>
  );
}
