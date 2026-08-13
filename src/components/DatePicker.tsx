"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateShort, todayInputValue } from "@/lib/format";
import { useCalendarSettings } from "@/lib/use-calendar-settings";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

export default function DatePicker({
  id,
  value,
  onChange,
  required,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchor = value || todayInputValue();
  const [viewYear, setViewYear] = useState(() => parseKey(anchor).y);
  const [viewMonth, setViewMonth] = useState(() => parseKey(anchor).m);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
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

  // The calendar renders in a portal to document.body (rather than in normal
  // flow inside this component) so its backdrop-blur samples whatever's
  // really behind it on the page — inside a modal, staying in normal flow
  // would mean blurring the modal's own already-frosted glass sheet instead,
  // which looks flat rather than the crisp glass effect used everywhere else.
  useEffect(() => {
    if (!open || !containerRef.current) {
      setPanelPos(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 288);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setPanelPos({ top: rect.bottom + 6, left, width });
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
    onChange(key);
    setOpen(false);
  }

  function goToday() {
    const today = todayInputValue();
    const parsed = parseKey(today);
    setViewYear(parsed.y);
    setViewMonth(parsed.m);
    onChange(today);
    setOpen(false);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" id={id} value={value} required={required} readOnly />
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              const parsed = parseKey(anchor);
              setViewYear(parsed.y);
              setViewMonth(parsed.m);
            }
            return !o;
          });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-1.5 rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-left text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
      >
        <span>{value ? formatDateShort(value) : "Select date"}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-surface-foreground-soft" />
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Select date"
            style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
            className="fixed z-[60] rounded-2xl border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-3.5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
          >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-surface-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className={`grid gap-y-0.5 text-center ${showWeekNumbers ? "grid-cols-8" : "grid-cols-7"}`}>
            {showWeekNumbers && <span className="py-1 text-[11px] font-semibold text-surface-foreground-soft/60">Wk</span>}
            {weekdayLabels.map((w) => (
              <span key={w} className="py-1 text-[11px] font-semibold text-surface-foreground-soft">
                {w}
              </span>
            ))}
            {weeks.map((week) => (
              <Fragment key={week[0].key}>
                {showWeekNumbers && (
                  <span
                    key={`wk-${week[0].key}`}
                    className="flex h-8 w-full items-center justify-center text-[11px] text-surface-foreground-soft/60"
                  >
                    {weekNumber(week[0].y, week[0].m, week[0].d)}
                  </span>
                )}
                {week.map((cell) => {
                  const isSelected = cell.key === value;
                  const isToday = cell.key === todayInputValue();
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => pickDay(cell.key)}
                      className={`relative h-8 w-full rounded-full text-sm transition ${
                        cell.inMonth ? "text-surface-foreground" : "text-surface-foreground-soft/40"
                      } ${isSelected ? "bg-navy font-semibold text-white" : "hover:bg-[var(--surface-nav-hover)]"}`}
                    >
                      {isToday && !isSelected && (
                        <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-navy" />
                      )}
                      {cell.label}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div className="mt-3.5 flex justify-end">
            <button
              type="button"
              onClick={goToday}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
            >
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
