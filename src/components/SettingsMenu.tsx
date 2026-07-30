"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SettingsPanel from "./SettingsPanel";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 14, right: window.innerWidth - rect.right });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
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

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground ${
          open ? "bg-[var(--nav-hover-bg)] text-foreground" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-[19px] w-[19px]">
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="9" cy="6" r="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="15" cy="12" r="2" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="9" cy="18" r="2" />
        </svg>
      </button>

      {open && position &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: position.top, right: position.right }}
            className="z-50 w-56 rounded-[20px] border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
          >
            <SettingsPanel />
          </div>,
          document.body,
        )}
    </>
  );
}
