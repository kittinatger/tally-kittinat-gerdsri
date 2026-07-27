"use client";

import { useEffect, useRef, useState } from "react";

export default function FilterDropdown({
  value,
  allLabel,
  options,
  onChange,
}: {
  value: string;
  allLabel: string;
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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-1.5 rounded-full border border-line bg-bg-soft px-3.5 py-2 text-sm font-medium text-foreground transition hover:border-navy sm:w-auto"
      >
        <span className="truncate">{value === "all" ? allLabel : value}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-56 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === "all"}
            onClick={() => select("all")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              value === "all" ? "bg-bg-soft text-foreground" : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
            }`}
          >
            {allLabel}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={value === opt}
              onClick={() => select(opt)}
              className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                value === opt ? "bg-bg-soft text-foreground" : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
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
