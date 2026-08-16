"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/lib/icons";

type FilterOption = string | { value: string; label: string };

function optionValue(opt: FilterOption): string {
  return typeof opt === "string" ? opt : opt.value;
}

function optionLabel(opt: FilterOption): string {
  return typeof opt === "string" ? opt : opt.label;
}

export default function FilterDropdown({
  value,
  allLabel,
  options,
  onChange,
}: {
  value: string;
  allLabel: string;
  options: FilterOption[];
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
        <span className="truncate">
          {value === "all" ? allLabel : (optionLabel(options.find((opt) => optionValue(opt) === value) ?? value))}
        </span>
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-56 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
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
          {options.map((opt) => {
            const optValue = optionValue(opt);
            return (
              <button
                key={optValue}
                type="button"
                role="option"
                aria-selected={value === optValue}
                onClick={() => select(optValue)}
                className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  value === optValue ? "bg-bg-soft text-foreground" : "text-ink-soft hover:bg-bg-soft hover:text-foreground"
                }`}
              >
                {optionLabel(opt)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
