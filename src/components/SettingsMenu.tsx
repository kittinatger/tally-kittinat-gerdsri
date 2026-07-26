"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Theme = "light" | "dark";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  // Safe to read the DOM directly here (no effect needed): this only ever
  // differs from the server-rendered default while the portal below is
  // closed, and that portal isn't part of the SSR output at all.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );
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

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tally-theme", next);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the toggle
      // still works for the current session either way.
    }
  }

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
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Theme</p>
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[19px] w-[19px]">
                    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[19px] w-[19px]">
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
                  </svg>
                )}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
