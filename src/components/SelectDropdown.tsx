"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronIcon } from "@/lib/icons";

export default function SelectDropdown({
  id,
  value,
  options,
  onChange,
  renderIndicator,
}: {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Optional small indicator (e.g. a category color dot) rendered before
   * each option's label, both in the closed trigger and the open list. */
  renderIndicator?: (option: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Portaled to document.body so its backdrop-blur samples the real page
  // behind it — see DatePicker.tsx for why (nested inside a modal's own
  // glass sheet, backdrop-blur would otherwise just blur that flat panel).
  useEffect(() => {
    if (!open || !containerRef.current) {
      setPanelPos(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    // Scrolling inside the option list itself (it's independently
    // scrollable when it overflows max-h-64) must not close the dropdown —
    // only scrolling the page/an ancestor behind it should.
    function close(e: Event) {
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-1.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-left text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
      >
        <span className="flex min-w-0 items-center gap-2">
          {renderIndicator?.(value)}
          <span className="truncate">{value}</span>
        </span>
        <ChevronIcon
          className={`h-3.5 w-3.5 shrink-0 text-surface-foreground-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
            className="fixed z-[60] max-h-64 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => select(opt)}
                className={`flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  value === opt
                    ? "bg-[var(--surface-nav-hover)] text-surface-foreground"
                    : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
                }`}
              >
                {renderIndicator?.(opt)}
                <span className="truncate">{opt}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
