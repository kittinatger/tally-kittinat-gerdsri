"use client";

import { useEffect, useRef, useState } from "react";
import { MoreIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

export type OverflowMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

// A "..." trigger + dropdown for actions that don't need to be permanently
// visible buttons — e.g. Edit inside a detail view's Modal header, matching
// the pattern of hiding secondary actions behind an overflow menu rather
// than a row of buttons in the body.
export default function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("common.more")}
        aria-expanded={open}
        className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
      >
        <MoreIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-soft">
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
        </div>
      )}
    </div>
  );
}
