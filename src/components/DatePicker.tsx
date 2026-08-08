"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateShort, todayInputValue } from "@/lib/format";
import { useCalendarSettings } from "@/lib/use-calendar-settings";

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
    setPanelPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 288) });
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
        <svg viewBox="0 0 25.3809 22.9785" fill="currentColor" className="h-4 w-4 shrink-0 text-surface-foreground-soft">
          <path d="M3.79883 22.9785L21.2109 22.9785C23.7402 22.9785 25.0195 21.709 25.0195 19.2188L25.0195 3.78906C25.0195 1.29883 23.7402 0.0292969 21.2109 0.0292969L3.79883 0.0292969C1.2793 0.0292969 0 1.28906 0 3.78906L0 19.2188C0 21.7188 1.2793 22.9785 3.79883 22.9785ZM3.66211 21.25C2.41211 21.25 1.72852 20.5859 1.72852 19.2969L1.72852 7.64648C1.72852 6.34766 2.41211 5.69336 3.66211 5.69336L21.3379 5.69336C22.5781 5.69336 23.2812 6.34766 23.2812 7.64648L23.2812 19.2969C23.2812 20.5859 22.5781 21.25 21.3379 21.25ZM10.0195 10.1855L10.7617 10.1855C11.1816 10.1855 11.2988 10.0684 11.2988 9.6582L11.2988 8.92578C11.2988 8.51562 11.1816 8.4082 10.7617 8.4082L10.0195 8.4082C9.60938 8.4082 9.49219 8.51562 9.49219 8.92578L9.49219 9.6582C9.49219 10.0684 9.60938 10.1855 10.0195 10.1855ZM14.2676 10.1855L15.0098 10.1855C15.4199 10.1855 15.5371 10.0684 15.5371 9.6582L15.5371 8.92578C15.5371 8.51562 15.4199 8.4082 15.0098 8.4082L14.2676 8.4082C13.8477 8.4082 13.7305 8.51562 13.7305 8.92578L13.7305 9.6582C13.7305 10.0684 13.8477 10.1855 14.2676 10.1855ZM18.5059 10.1855L19.248 10.1855C19.6582 10.1855 19.7852 10.0684 19.7852 9.6582L19.7852 8.92578C19.7852 8.51562 19.6582 8.4082 19.248 8.4082L18.5059 8.4082C18.0957 8.4082 17.9688 8.51562 17.9688 8.92578L17.9688 9.6582C17.9688 10.0684 18.0957 10.1855 18.5059 10.1855ZM5.78125 14.3555L6.52344 14.3555C6.93359 14.3555 7.06055 14.248 7.06055 13.8379L7.06055 13.0957C7.06055 12.6953 6.93359 12.5781 6.52344 12.5781L5.78125 12.5781C5.37109 12.5781 5.24414 12.6953 5.24414 13.0957L5.24414 13.8379C5.24414 14.248 5.37109 14.3555 5.78125 14.3555ZM10.0195 14.3555L10.7617 14.3555C11.1816 14.3555 11.2988 14.248 11.2988 13.8379L11.2988 13.0957C11.2988 12.6953 11.1816 12.5781 10.7617 12.5781L10.0195 12.5781C9.60938 12.5781 9.49219 12.6953 9.49219 13.0957L9.49219 13.8379C9.49219 14.248 9.60938 14.3555 10.0195 14.3555ZM14.2676 14.3555L15.0098 14.3555C15.4199 14.3555 15.5371 14.248 15.5371 13.8379L15.5371 13.0957C15.5371 12.6953 15.4199 12.5781 15.0098 12.5781L14.2676 12.5781C13.8477 12.5781 13.7305 12.6953 13.7305 13.0957L13.7305 13.8379C13.7305 14.248 13.8477 14.3555 14.2676 14.3555ZM18.5059 14.3555L19.248 14.3555C19.6582 14.3555 19.7852 14.248 19.7852 13.8379L19.7852 13.0957C19.7852 12.6953 19.6582 12.5781 19.248 12.5781L18.5059 12.5781C18.0957 12.5781 17.9688 12.6953 17.9688 13.0957L17.9688 13.8379C17.9688 14.248 18.0957 14.3555 18.5059 14.3555ZM5.78125 18.5352L6.52344 18.5352C6.93359 18.5352 7.06055 18.4277 7.06055 18.0176L7.06055 17.2754C7.06055 16.8652 6.93359 16.7578 6.52344 16.7578L5.78125 16.7578C5.37109 16.7578 5.24414 16.8652 5.24414 17.2754L5.24414 18.0176C5.24414 18.4277 5.37109 18.5352 5.78125 18.5352ZM10.0195 18.5352L10.7617 18.5352C11.1816 18.5352 11.2988 18.4277 11.2988 18.0176L11.2988 17.2754C11.2988 16.8652 11.1816 16.7578 10.7617 16.7578L10.0195 16.7578C9.60938 16.7578 9.49219 16.8652 9.49219 17.2754L9.49219 18.0176C9.49219 18.4277 9.60938 18.5352 10.0195 18.5352ZM14.2676 18.5352L15.0098 18.5352C15.4199 18.5352 15.5371 18.4277 15.5371 18.0176L15.5371 17.2754C15.5371 16.8652 15.4199 16.7578 15.0098 16.7578L14.2676 16.7578C13.8477 16.7578 13.7305 16.8652 13.7305 17.2754L13.7305 18.0176C13.7305 18.4277 13.8477 18.5352 14.2676 18.5352Z" />
        </svg>
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
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 0 1 .02 1.06L9.832 10l2.978 3.71a.75.75 0 1 1-1.06 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-surface-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
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
