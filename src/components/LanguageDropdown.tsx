"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/languages";
import { ChevronIcon } from "@/lib/icons";

export default function LanguageDropdown({
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
  const current = LANGUAGES.find((l) => l.code === value);

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
        <span className="truncate">{current ? `${current.nativeName} — ${current.name}` : value}</span>
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={value === l.code}
              onClick={() => select(l.code)}
              className={`w-full truncate rounded-xl px-3 py-1.5 text-left text-sm font-medium transition ${
                value === l.code ? "bg-bg-soft text-foreground" : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
              }`}
            >
              {l.nativeName} — {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
