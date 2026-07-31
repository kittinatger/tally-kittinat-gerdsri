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
  alignTopRef,
  alignRightRef,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** Element whose top edge the popover's top should line up with. */
  alignTopRef?: React.RefObject<HTMLElement | null>;
  /** Element whose right edge the popover's right should line up with. */
  alignRightRef?: React.RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [pickingSecond, setPickingSecond] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseKey(todayInputValue()).y);
  const [viewMonth, setViewMonth] = useState(() => parseKey(todayInputValue()).m);
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(null);
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

  useEffect(() => {
    if (!open) return;
    function reposition() {
      const topEl = alignTopRef?.current;
      const rightEl = alignRightRef?.current;
      if (!topEl || !rightEl) {
        setPopoverPos(null);
        return;
      }
      const topRect = topEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      setPopoverPos({ top: topRect.top, right: Math.max(0, window.innerWidth - rightRect.right - 6) });
    }
    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open, alignTopRef, alignRightRef]);

  useEffect(() => {
    if (!open || !popoverPos) return;
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, popoverPos]);

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
        <svg viewBox="0 0 25.3809 22.9785" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-ink-soft">
          <path d="M3.79883 22.9785L21.2109 22.9785C23.7402 22.9785 25.0195 21.709 25.0195 19.2188L25.0195 3.78906C25.0195 1.29883 23.7402 0.0292969 21.2109 0.0292969L3.79883 0.0292969C1.2793 0.0292969 0 1.28906 0 3.78906L0 19.2188C0 21.7188 1.2793 22.9785 3.79883 22.9785ZM3.66211 21.25C2.41211 21.25 1.72852 20.5859 1.72852 19.2969L1.72852 7.64648C1.72852 6.34766 2.41211 5.69336 3.66211 5.69336L21.3379 5.69336C22.5781 5.69336 23.2812 6.34766 23.2812 7.64648L23.2812 19.2969C23.2812 20.5859 22.5781 21.25 21.3379 21.25ZM10.0195 10.1855L10.7617 10.1855C11.1816 10.1855 11.2988 10.0684 11.2988 9.6582L11.2988 8.92578C11.2988 8.51562 11.1816 8.4082 10.7617 8.4082L10.0195 8.4082C9.60938 8.4082 9.49219 8.51562 9.49219 8.92578L9.49219 9.6582C9.49219 10.0684 9.60938 10.1855 10.0195 10.1855ZM14.2676 10.1855L15.0098 10.1855C15.4199 10.1855 15.5371 10.0684 15.5371 9.6582L15.5371 8.92578C15.5371 8.51562 15.4199 8.4082 15.0098 8.4082L14.2676 8.4082C13.8477 8.4082 13.7305 8.51562 13.7305 8.92578L13.7305 9.6582C13.7305 10.0684 13.8477 10.1855 14.2676 10.1855ZM18.5059 10.1855L19.248 10.1855C19.6582 10.1855 19.7852 10.0684 19.7852 9.6582L19.7852 8.92578C19.7852 8.51562 19.6582 8.4082 19.248 8.4082L18.5059 8.4082C18.0957 8.4082 17.9688 8.51562 17.9688 8.92578L17.9688 9.6582C17.9688 10.0684 18.0957 10.1855 18.5059 10.1855ZM5.78125 14.3555L6.52344 14.3555C6.93359 14.3555 7.06055 14.248 7.06055 13.8379L7.06055 13.0957C7.06055 12.6953 6.93359 12.5781 6.52344 12.5781L5.78125 12.5781C5.37109 12.5781 5.24414 12.6953 5.24414 13.0957L5.24414 13.8379C5.24414 14.248 5.37109 14.3555 5.78125 14.3555ZM10.0195 14.3555L10.7617 14.3555C11.1816 14.3555 11.2988 14.248 11.2988 13.8379L11.2988 13.0957C11.2988 12.6953 11.1816 12.5781 10.7617 12.5781L10.0195 12.5781C9.60938 12.5781 9.49219 12.6953 9.49219 13.0957L9.49219 13.8379C9.49219 14.248 9.60938 14.3555 10.0195 14.3555ZM14.2676 14.3555L15.0098 14.3555C15.4199 14.3555 15.5371 14.248 15.5371 13.8379L15.5371 13.0957C15.5371 12.6953 15.4199 12.5781 15.0098 12.5781L14.2676 12.5781C13.8477 12.5781 13.7305 12.6953 13.7305 13.0957L13.7305 13.8379C13.7305 14.248 13.8477 14.3555 14.2676 14.3555ZM18.5059 14.3555L19.248 14.3555C19.6582 14.3555 19.7852 14.248 19.7852 13.8379L19.7852 13.0957C19.7852 12.6953 19.6582 12.5781 19.248 12.5781L18.5059 12.5781C18.0957 12.5781 17.9688 12.6953 17.9688 13.0957L17.9688 13.8379C17.9688 14.248 18.0957 14.3555 18.5059 14.3555ZM5.78125 18.5352L6.52344 18.5352C6.93359 18.5352 7.06055 18.4277 7.06055 18.0176L7.06055 17.2754C7.06055 16.8652 6.93359 16.7578 6.52344 16.7578L5.78125 16.7578C5.37109 16.7578 5.24414 16.8652 5.24414 17.2754L5.24414 18.0176C5.24414 18.4277 5.37109 18.5352 5.78125 18.5352ZM10.0195 18.5352L10.7617 18.5352C11.1816 18.5352 11.2988 18.4277 11.2988 18.0176L11.2988 17.2754C11.2988 16.8652 11.1816 16.7578 10.7617 16.7578L10.0195 16.7578C9.60938 16.7578 9.49219 16.8652 9.49219 17.2754L9.49219 18.0176C9.49219 18.4277 9.60938 18.5352 10.0195 18.5352ZM14.2676 18.5352L15.0098 18.5352C15.4199 18.5352 15.5371 18.4277 15.5371 18.0176L15.5371 17.2754C15.5371 16.8652 15.4199 16.7578 15.0098 16.7578L14.2676 16.7578C13.8477 16.7578 13.7305 16.8652 13.7305 17.2754L13.7305 18.0176C13.7305 18.4277 13.8477 18.5352 14.2676 18.5352Z" />
        </svg>
        <span className="truncate">{summary}</span>
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
          role="dialog"
          aria-label="Filter by date range"
          className={`z-30 w-72 rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl ${
            popoverPos ? "fixed" : "absolute right-0 top-[calc(100%+14px)]"
          }`}
          style={popoverPos ? { top: popoverPos.top, right: popoverPos.right } : undefined}
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
