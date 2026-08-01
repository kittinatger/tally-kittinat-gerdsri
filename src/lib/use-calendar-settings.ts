"use client";

import { useEffect, useState } from "react";

// Only the fields that feed live calendar rendering (DatePicker,
// DateRangeFilter) are exposed here. Fetched client-side once per calendar
// widget instance rather than threaded through every page as a prop, since
// these are lightweight, cacheable-by-the-browser GETs.
export function useCalendarSettings() {
  const [weekStartDay, setWeekStartDay] = useState(0);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar-settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.weekStartDay === "number") setWeekStartDay(data.weekStartDay);
        if (typeof data.showWeekNumbers === "boolean") setShowWeekNumbers(data.showWeekNumbers);
      })
      .catch(() => {
        // Fall back to Sunday-start with no week numbers.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { weekStartDay, showWeekNumbers };
}
