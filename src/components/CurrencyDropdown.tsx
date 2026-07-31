"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

export default function CurrencyDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = CURRENCIES.find((c) => c.code === value);

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

  function select(code: string) {
    onChange(code);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-1.5 rounded-xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-2.5 py-1.5 text-sm text-foreground shadow-soft outline-none backdrop-blur-xl transition hover:border-navy focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-60"
      >
        <span className="truncate">
          {current ? `${current.code} — ${current.name}` : value}
        </span>
        <svg
          viewBox="0 0 20.3027 20.5176"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M19.9414 1.38672C19.9414 0.546875 19.3066 0.0195312 18.3105 0.0195312L1.64062 0.00976562C0.634766 0.00976562 0 0.537109 0 1.37695C0 1.83594 0.195312 2.1875 0.439453 2.68555L8.45703 19.2578C8.92578 20.2051 9.36523 20.5176 9.9707 20.5176C10.5859 20.5176 11.0254 20.2051 11.4844 19.2578L19.5117 2.68555C19.7461 2.19727 19.9414 1.8457 19.9414 1.38672Z" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Currency"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={value === c.code}
              onClick={() => select(c.code)}
              className={`w-full truncate rounded-xl px-3 py-1.5 text-left text-sm font-medium transition ${
                value === c.code
                  ? "bg-bg-soft text-foreground"
                  : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
              }`}
            >
              {c.code} — {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
