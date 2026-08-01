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
          viewBox="0 0 21.6895 12.959"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M10.6641 12.959C10.9473 12.959 11.2109 12.832 11.4062 12.6172L21.0352 2.58789C21.2207 2.40234 21.3281 2.16797 21.3281 1.89453C21.3281 1.34766 20.9082 0.927734 20.3516 0.927734C20.0977 0.927734 19.8438 1.02539 19.6582 1.20117L10.0684 11.1816L11.2695 11.1816L1.66016 1.20117C1.48438 1.02539 1.24023 0.927734 0.976562 0.927734C0.419922 0.927734 0 1.34766 0 1.89453C0 2.16797 0.117188 2.40234 0.292969 2.59766L9.92188 12.627C10.1367 12.832 10.3809 12.959 10.6641 12.959Z" />
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
