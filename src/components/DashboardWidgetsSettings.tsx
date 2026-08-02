"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import {
  DASHBOARD_WIDGET_TYPES,
  DASHBOARD_WIDGET_INFO,
  DEFAULT_DASHBOARD_WIDGETS,
  SUMMARY_CARDS,
  SUMMARY_CARD_LABELS,
  WIDGET_ACCENTS,
  WIDGET_WIDTH_LABELS,
  WIDGET_WIDTH_COLSPAN,
  SUPPORTED_WIDTHS,
  LIMIT_OPTIONS,
  ACCENT_CAPABLE_TYPES,
  LIMIT_CAPABLE_TYPES,
  newWidgetInstance,
  type DashboardWidgetInstance,
  type SummaryCardId,
  type WidgetAccent,
} from "@/lib/dashboard-widgets";
import { dotClasses } from "@/lib/category-styles";
import DashboardWidgetContent from "./DashboardWidgetContent";

function GripIcon() {
  return (
    <svg viewBox="0 0 10 16" fill="currentColor" className="h-4 w-4">
      <circle cx="2.5" cy="2" r="1.4" />
      <circle cx="7.5" cy="2" r="1.4" />
      <circle cx="2.5" cy="8" r="1.4" />
      <circle cx="7.5" cy="8" r="1.4" />
      <circle cx="2.5" cy="14" r="1.4" />
      <circle cx="7.5" cy="14" r="1.4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20.918 20.5762" fill="currentColor" className="h-3 w-3 shrink-0">
      <path d="M11.2305 19.5996L11.2305 0.957031C11.2305 0.439453 10.8008 0 10.2734 0C9.75586 0 9.32617 0.439453 9.32617 0.957031L9.32617 19.5996C9.32617 20.1172 9.75586 20.5566 10.2734 20.5566C10.8008 20.5566 11.2305 20.1172 11.2305 19.5996ZM0.957031 11.2305L19.5996 11.2305C20.1172 11.2305 20.5566 10.8008 20.5566 10.2832C20.5566 9.75586 20.1172 9.32617 19.5996 9.32617L0.957031 9.32617C0.439453 9.32617 0 9.75586 0 10.2832C0 10.8008 0.439453 11.2305 0.957031 11.2305Z" />
    </svg>
  );
}

export default function DashboardWidgetsSettings({
  expenses,
  categories,
  remaining,
}: {
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
}) {
  const [widgets, setWidgets] = useState<DashboardWidgetInstance[]>(() => DEFAULT_DASHBOARD_WIDGETS());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard-widgets")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.widgets)) setWidgets(data.widgets);
      })
      .catch(() => {
        // Keep defaults; the user can still edit and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: DashboardWidgetInstance[]) {
    const previous = widgets;
    setWidgets(next);
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
    }
  }

  // Pointer Events (not HTML5 drag-and-drop) so this works with touch as
  // well as mouse — native HTML5 DnD never fires from a touch gesture.
  function handlePointerDown(e: React.PointerEvent, index: number) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
    setOverIndex(index);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tile = el?.closest("[data-widget-index]");
    if (!tile) return;
    const idx = Number(tile.getAttribute("data-widget-index"));
    if (!Number.isNaN(idx)) setOverIndex(idx);
  }

  function handlePointerUp() {
    if (dragIndex !== null && overIndex !== null && overIndex !== dragIndex) {
      const next = [...widgets];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      persist(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function cycleWidth(index: number) {
    const w = widgets[index];
    const supported = SUPPORTED_WIDTHS[w.type];
    const next = supported[(supported.indexOf(w.width) + 1) % supported.length];
    persist(widgets.map((wi, i) => (i === index ? { ...wi, width: next } : wi)));
  }

  function toggleCard(index: number, card: SummaryCardId) {
    const current = widgets[index].cards ?? [...SUMMARY_CARDS];
    const included = current.includes(card);
    if (included && current.length <= 1) return; // keep at least one card visible
    const next = included ? current.filter((c) => c !== card) : [...current, card];
    persist(widgets.map((w, i) => (i === index ? { ...w, cards: next } : w)));
  }

  function setAccent(index: number, accent: WidgetAccent) {
    persist(widgets.map((w, i) => (i === index ? { ...w, accent: w.accent === accent ? undefined : accent } : w)));
  }

  function setLimit(index: number, limit: number) {
    persist(widgets.map((w, i) => (i === index ? { ...w, limit } : w)));
  }

  function removeWidget(index: number) {
    persist(widgets.filter((_, i) => i !== index));
  }

  function addWidget(type: (typeof DASHBOARD_WIDGET_TYPES)[number]) {
    persist([...widgets, newWidgetInstance(type)]);
  }

  return (
    <div>
      <p className="mb-4 text-[11px] leading-snug text-ink-soft">
        Drag tiles to rearrange them, tap the size button to cycle through the sizes that widget supports (some
        don&apos;t fit every size), or add the same widget more than once — for example two category charts at
        once.
      </p>

      {widgets.length === 0 ? (
        <p className="mb-4 rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
          Your dashboard is empty. Add a widget below to get started.
        </p>
      ) : (
        <div className="mb-5 grid grid-cols-4 gap-3">
          {widgets.map((w, i) => {
            const info = DASHBOARD_WIDGET_INFO[w.type];
            const supported = SUPPORTED_WIDTHS[w.type];
            return (
              <div
                key={w.id}
                data-widget-index={i}
                className={`rounded-card border bg-surface p-3 transition ${WIDGET_WIDTH_COLSPAN[w.width]} ${
                  dragIndex === i ? "opacity-40" : overIndex === i && dragIndex !== null ? "border-navy" : "border-line"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    onPointerDown={(e) => handlePointerDown(e, i)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{ touchAction: "none" }}
                    className="cursor-grab rounded p-1 text-ink-soft transition hover:bg-bg-soft hover:text-foreground active:cursor-grabbing"
                    aria-label={`Drag to reorder ${info.title}`}
                  >
                    <GripIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{info.title}</p>
                  </div>
                  {supported.length > 1 && (
                    <button
                      type="button"
                      onClick={() => cycleWidth(i)}
                      title={`Sizes available: ${supported.map((s) => WIDGET_WIDTH_LABELS[s]).join(", ")}`}
                      className="shrink-0 rounded-full bg-bg-soft px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition hover:text-foreground"
                    >
                      {WIDGET_WIDTH_LABELS[w.width]}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeWidget(i)}
                    aria-label={`Remove ${info.title}`}
                    className="shrink-0 rounded-full p-1.5 text-ink-soft transition hover:bg-bg-soft hover:text-red-600 dark:hover:text-red-400"
                  >
                    <XIcon />
                  </button>
                </div>

                {w.type === "summary" && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {SUMMARY_CARDS.map((card) => {
                      const included = (w.cards ?? [...SUMMARY_CARDS]).includes(card);
                      return (
                        <button
                          key={card}
                          type="button"
                          onClick={() => toggleCard(i, card)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            included
                              ? "bg-navy text-white"
                              : "bg-bg-soft text-ink-soft hover:text-foreground"
                          }`}
                        >
                          {SUMMARY_CARD_LABELS[card]}
                        </button>
                      );
                    })}
                  </div>
                )}

                {LIMIT_CAPABLE_TYPES.includes(w.type) && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink-soft">Show</span>
                    {LIMIT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setLimit(i, n)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                          (w.limit ?? 5) === n ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {ACCENT_CAPABLE_TYPES.includes(w.type) && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink-soft">Color</span>
                    {WIDGET_ACCENTS.map((accent) => (
                      <button
                        key={accent}
                        type="button"
                        onClick={() => setAccent(i, accent)}
                        aria-label={accent}
                        className={`h-5 w-5 rounded-full transition ${dotClasses(accent)} ${
                          w.accent === accent ? "ring-2 ring-navy ring-offset-1 ring-offset-surface" : ""
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="pointer-events-none select-none opacity-90">
                  <DashboardWidgetContent widget={w} expenses={expenses} categories={categories} remaining={remaining} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Add a widget</p>
      <div className="flex flex-wrap gap-2">
        {DASHBOARD_WIDGET_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addWidget(type)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition hover:border-navy"
          >
            <PlusIcon />
            {DASHBOARD_WIDGET_INFO[type].title}
          </button>
        ))}
      </div>
    </div>
  );
}
