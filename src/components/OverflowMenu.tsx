"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

export type OverflowMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

// A "..." trigger + dropdown for actions that don't need to be permanently
// visible buttons — e.g. Edit inside a detail view's Modal header, or the
// consolidated per-row actions in a list, matching the pattern of hiding
// secondary actions behind an overflow menu rather than a row of buttons.
//
// The dropdown itself renders through a portal into document.body,
// positioned via the trigger's own on-screen coordinates (position:
// fixed) instead of being absolutely positioned inside the trigger's own
// wrapper. Two real bugs otherwise show up wherever this sits inside a
// rounded/divided list (which clips overflow to keep row backgrounds
// inside its rounded corners): the dropdown gets visually cut off by
// that ancestor's overflow-hidden, and — since a fixed bottom nav bar
// sits at z-20 — a dropdown near the bottom of the screen renders
// *underneath* the nav's glass/blur background, making it look like the
// dropdown itself has a broken, half-transparent background.
export default function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    // Closes rather than re-anchors on scroll — simpler than tracking the
    // trigger's position live, and this is a short-lived menu anyway.
    // Capture phase so scrolling any nested scroll container (not just
    // the window) closes it too.
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label={t("common.more")}
        aria-expanded={open}
        className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
      >
        <MoreIcon className="h-4 w-4" />
      </button>
      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            // Above the fixed bottom nav bar (z-20) and any open Modal
            // (z-50) — this can be triggered from inside either.
            className="z-[60] w-44 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-soft animate-[popover-in_0.15s_ease-out] motion-reduce:animate-none"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition ${
                  item.destructive
                    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    : "text-surface-foreground hover:bg-[var(--surface-nav-hover)]"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
