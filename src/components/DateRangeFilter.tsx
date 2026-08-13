"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateShort, todayInputValue } from "@/lib/format";
import { useCalendarSettings } from "@/lib/use-calendar-settings";
import { CalendarIcon, ChevronIcon, ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PANEL_WIDTH = 288;
const VIEWPORT_MARGIN = 8;

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
}

// ISO-8601 week number of the year for the given date.
function weekNumber(y: number, m: number, d: number): number {
  const date = new Date(Date.UTC(y, m, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { weekStartDay, showWeekNumbers } = useCalendarSettings();
  const weekdayLabels = useMemo(
    () => WEEKDAYS.slice(weekStartDay).concat(WEEKDAYS.slice(0, weekStartDay)),
    [weekStartDay],
  );

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
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

  // Portaled to document.body (see DatePicker.tsx for why: nested inside a
  // modal, a plain absolute popover both blurs the wrong layer and can be
  // clipped by the modal's own scroll container) and, since this panel is
  // tall enough to sometimes not fit below the trigger, re-measured after
  // its first paint so it flips above/clamps on-screen instead of running
  // off the bottom of the viewport.
  useEffect(() => {
    if (!open || !containerRef.current) {
      setPanelPos(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - PANEL_WIDTH),
      window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN,
    );
    setPanelPos({ top: rect.bottom + 6, left });
    function close() {
      setOpen(false);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !panelPos || !panelRef.current || !containerRef.current) return;
    const panelRect = panelRef.current.getBoundingClientRect();
    const overflowBottom = panelRect.bottom - (window.innerHeight - VIEWPORT_MARGIN);
    if (overflowBottom > 0) {
      const triggerRect = containerRef.current.getBoundingClientRect();
      const flippedTop = triggerRect.top - 6 - panelRect.height;
      setPanelPos((prev) =>
        prev ? { ...prev, top: Math.max(VIEWPORT_MARGIN, flippedTop) } : prev,
      );
    }
    // Only re-run when the panel first opens (or its position basis changes) —
    // re-measuring after the flip itself would just toggle back and forth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panelPos?.top === undefined]);

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
    const startWeekday = (firstOfMonth.getDay() - weekStartDay + 7) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{ key: string; label: number; inMonth: boolean; y: number; m: number; d: number }> = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      cells.push({ key: toKey(y, m, d), label: d, inMonth: false, y, m, d });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: toKey(viewYear, viewMonth, d), label: d, inMonth: true, y: viewYear, m: viewMonth, d });
    }
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      cells.push({ key: toKey(y, m, nextDay), label: nextDay, inMonth: false, y, m, d: nextDay });
      nextDay++;
    }
    return cells;
  }, [viewYear, viewMonth, weekStartDay]);

  const weeks = useMemo(() => {
    const chunks: (typeof days)[] = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    return chunks;
  }, [days]);

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
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <span className="truncate">{summary}</span>
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Filter by date range"
            style={{ top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
            className="fixed z-[60] rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
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
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="rounded-full p-1.5 text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <div className={`grid gap-y-0.5 text-center ${showWeekNumbers ? "grid-cols-8" : "grid-cols-7"}`}>
              {showWeekNumbers && <span className="py-1 text-[11px] font-semibold text-ink-soft/60">Wk</span>}
              {weekdayLabels.map((w) => (
                <span key={w} className="py-1 text-[11px] font-semibold text-ink-soft">
                  {w}
                </span>
              ))}
              {weeks.map((week) => (
                <Fragment key={week[0].key}>
                  {showWeekNumbers && (
                    <span className="flex h-8 w-full items-center justify-center text-[11px] text-ink-soft/60">
                      {weekNumber(week[0].y, week[0].m, week[0].d)}
                    </span>
                  )}
                  {week.map((cell) => {
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
                </Fragment>
              ))}
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
          </div>,
          document.body,
        )}
    </div>
  );
}
