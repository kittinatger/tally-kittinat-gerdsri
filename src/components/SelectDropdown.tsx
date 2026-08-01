"use client";

import { useEffect, useRef, useState } from "react";

export default function SelectDropdown({
  id,
  value,
  options,
  onChange,
}: {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
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
        <span className="truncate">{value}</span>
        <svg
          viewBox="0 0 21.6895 12.959"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-surface-foreground-soft transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M10.6641 12.959C10.9473 12.959 11.2109 12.832 11.4062 12.6172L21.0352 2.58789C21.2207 2.40234 21.3281 2.16797 21.3281 1.89453C21.3281 1.34766 20.9082 0.927734 20.3516 0.927734C20.0977 0.927734 19.8438 1.02539 19.6582 1.20117L10.0684 11.1816L11.2695 11.1816L1.66016 1.20117C1.48438 1.02539 1.24023 0.927734 0.976562 0.927734C0.419922 0.927734 0 1.34766 0 1.89453C0 2.16797 0.117188 2.40234 0.292969 2.59766L9.92188 12.627C10.1367 12.832 10.3809 12.959 10.6641 12.959Z" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[var(--modal-glass-border)] bg-[image:var(--modal-glass-bg)] p-1.5 shadow-[var(--modal-panel-shadow)] backdrop-blur-xl"
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={value === opt}
              onClick={() => select(opt)}
              className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                value === opt
                  ? "bg-[var(--surface-nav-hover)] text-surface-foreground"
                  : "text-surface-foreground-soft hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
