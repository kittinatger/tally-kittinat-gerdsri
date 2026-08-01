"use client";

import { useEffect, useState } from "react";
import {
  DASHBOARD_WIDGET_INFO,
  DEFAULT_DASHBOARD_WIDGETS,
  type DashboardWidgetConfig,
} from "@/lib/dashboard-widgets";

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
        checked ? "bg-navy" : "bg-bg-soft"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function DashboardWidgetsSettings() {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_WIDGETS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard-widgets")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.widgets) && data.widgets.length > 0) setWidgets(data.widgets);
      })
      .catch(() => {
        // Keep defaults; the user can still edit and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: DashboardWidgetConfig[]) {
    const previous = widgets;
    setWidgets(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      });
      if (!res.ok) {
        setWidgets(previous);
        setError("Could not save.");
      }
    } catch {
      setWidgets(previous);
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function toggleVisible(index: number) {
    const next = widgets.map((w, i) => (i === index ? { ...w, visible: !w.visible } : w));
    save(next);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= widgets.length) return;
    const next = [...widgets];
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  }

  return (
    <div>
      <p className="mb-4 text-[11px] leading-snug text-ink-soft">
        Show, hide, and reorder the widgets on your Dashboard — like rearranging a home screen.
      </p>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {widgets.map((w, i) => {
          const info = DASHBOARD_WIDGET_INFO[w.id];
          return (
            <div
              key={w.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i === widgets.length - 1 ? "" : "border-b border-line"} ${
                w.visible ? "" : "opacity-60"
              }`}
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || saving}
                  aria-label={`Move ${info.title} up`}
                  className="rounded p-1 text-ink-soft transition hover:bg-bg-soft hover:text-foreground disabled:opacity-30"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M10 5.5a.75.75 0 0 1 .53.22l4 4a.75.75 0 1 1-1.06 1.06L10 7.31l-3.47 3.47a.75.75 0 1 1-1.06-1.06l4-4A.75.75 0 0 1 10 5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === widgets.length - 1 || saving}
                  aria-label={`Move ${info.title} down`}
                  className="rounded p-1 text-ink-soft transition hover:bg-bg-soft hover:text-foreground disabled:opacity-30"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M10 14.5a.75.75 0 0 1-.53-.22l-4-4a.75.75 0 1 1 1.06-1.06L10 12.69l3.47-3.47a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-.53.22Z" />
                  </svg>
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{info.title}</p>
                <p className="mt-0.5 truncate text-[11px] leading-snug text-ink-soft">{info.description}</p>
              </div>

              <Toggle
                checked={w.visible}
                onChange={() => toggleVisible(i)}
                disabled={saving}
                label={`Toggle ${info.title}`}
              />
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
