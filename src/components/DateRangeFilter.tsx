"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateShort, todayInputValue } from "@/lib/format";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
}

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
  const [pickingSecond, setPickingSecond] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseKey(todayInputValue()).y);
  const [viewMonth, setViewMonth] = useState(() => parseKey(todayInputValue()).m);
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

  const days = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{ key: string; label: number; inMonth: boolean }> = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      cells.push({ key: toKey(y, m, d), label: d, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: toKey(viewYear, viewMonth, d), label: d, inMonth: true });
    }
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      cells.push({ key: toKey(y, m, nextDay), label: nextDay, inMonth: false });
      nextDay++;
    }
    return cells;
  }, [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function pickDay(key: string) {
    if (!pickingSecond) {
      setDraftFrom(key);
      setDraftTo("");
      setPickingSecond(true);
      return;
    }
    if (key < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(key);
    } else {
      setDraftTo(key);
    }
    setPickingSecond(false);
  }

  function apply() {
    onChange(draftFrom, draftTo);
    setOpen(false);
  }

  function clear() {
    setDraftFrom("");
    setDraftTo("");
    setPickingSecond(false);
    onChange("", "");
    setOpen(false);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              setDraftFrom(from);
              setDraftTo(to);
              setPickingSecond(false);
              const anchor = from || to || todayInputValue();
              const parsed = parseKey(anchor);
              setViewYear(parsed.y);
              setViewMonth(parsed.m);
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
          className="absolute right-0 top-[calc(100%+14px)] z-30 w-72 rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-2.5 py-1.5 text-xs font-medium text-ink-soft">
            <span>{draftFrom ? formatDateShort(draftFrom) : "Start date"}</span>
            <span>–</span>
            <span>{draftTo ? formatDateShort(draftTo) : "End date"}</span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-full p-1.5 text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 0 1 .02 1.06L9.832 10l2.978 3.71a.75.75 0 1 1-1.06 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-full p-1.5 text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1-.02-1.06L10.168 10 7.19 6.29a.75.75 0 1 1 1.06-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-[11px] font-semibold text-ink-soft">
                {w}
              </span>
            ))}
            {days.map((cell) => {
              const isFrom = cell.key === draftFrom;
              const isTo = cell.key === draftTo;
              const inRange = draftFrom && draftTo && cell.key > draftFrom && cell.key < draftTo;
              const isToday = cell.key === todayInputValue();
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => pickDay(cell.key)}
                  className={`relative h-8 w-full text-sm transition ${
                    cell.inMonth ? "text-foreground" : "text-ink-soft/40"
                  } ${isFrom || isTo ? "font-semibold text-white" : "hover:bg-bg-soft"} ${
                    isFrom ? "rounded-l-full" : ""
                  } ${isTo ? "rounded-r-full" : ""} ${isFrom && isTo ? "rounded-full" : ""}`}
                  style={{
                    backgroundColor: isFrom || isTo ? "var(--navy)" : inRange ? "var(--navy-soft, rgba(24,64,58,0.12))" : undefined,
                  }}
                >
                  {isToday && !(isFrom || isTo) && (
                    <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-navy" />
                  )}
                  {cell.label}
                </button>
              );
            })}
          </div>

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
              disabled={!draftFrom}
              className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
