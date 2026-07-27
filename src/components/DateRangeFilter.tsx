"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateShort } from "@/lib/format";

export default function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
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

  const active = Boolean(from || to);
  const summary = !active
    ? "All dates"
    : from && to
      ? `${formatDateShort(from)} – ${formatDateShort(to)}`
      : from
        ? `From ${formatDateShort(from)}`
        : `Until ${formatDateShort(to)}`;

  function apply() {
    onChange(draftFrom, draftTo);
    setOpen(false);
  }

  function clear() {
    setDraftFrom("");
    setDraftTo("");
    onChange("", "");
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              setDraftFrom(from);
              setDraftTo(to);
            }
            return !o;
          });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex w-full items-center justify-between gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition sm:w-auto ${
          active ? "border-navy bg-navy/10 text-foreground" : "border-line bg-bg-soft text-foreground hover:border-navy"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-ink-soft">
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.5A2.25 2.25 0 0 1 17.75 6.25v8.5A2.25 2.25 0 0 1 15.5 17h-11a2.25 2.25 0 0 1-2.25-2.25v-8.5A2.25 2.25 0 0 1 4.5 4H5V2.75A.75.75 0 0 1 5.75 2ZM3.75 8v6.75c0 .414.336.75.75.75h11a.75.75 0 0 0 .75-.75V8h-12.5Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="truncate">{summary}</span>
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
          role="dialog"
          aria-label="Filter by date range"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-64 rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
        >
          <label className="block text-xs font-semibold text-ink-soft">
            From
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg-soft px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-ink-soft">
            To
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg-soft px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </label>
          <div className="mt-3.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clear}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
