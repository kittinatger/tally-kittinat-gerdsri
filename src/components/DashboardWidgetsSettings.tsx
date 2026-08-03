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
import Modal from "./Modal";

const WIDTH_LETTER = { small: "S", medium: "M", large: "L" } as const;

function PaintbrushIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M18.37 2.63 14 7l3 3 4.37-4.37a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0Z" />
      <path d="M9 8 3 14l3 3 6-6" />
      <path d="M6 17c0 2-1.5 2.5-2 3 1 .5 3 1 4-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-2.5 w-2.5">
      <path d="M4 10h12" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

// A real, non-interactive, scaled-down render of the widget — like the
// live tiles above but frozen at a fixed thumbnail size — so the add-widget
// list shows what each option actually looks like instead of just its name.
function WidgetThumbnail({
  type,
  expenses,
  categories,
  remaining,
}: {
  type: DashboardWidgetInstance["type"];
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
}) {
  return (
    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-surface-line bg-surface-soft">
      <div className="pointer-events-none w-[260px] origin-top-left select-none" style={{ transform: "scale(0.37)" }}>
        <DashboardWidgetContent
          widget={{ id: `preview-${type}`, type, width: "large" }}
          expenses={expenses}
          categories={categories}
          remaining={remaining}
        />
      </div>
    </div>
  );
}

export default function DashboardWidgetsSettings({
  expenses,
  categories,
  remaining,
  onDone,
}: {
  expenses: Expense[];
  categories: CategoryOption[];
  remaining: number;
  onDone: () => void;
}) {
  const [widgets, setWidgets] = useState<DashboardWidgetInstance[]>(() => DEFAULT_DASHBOARD_WIDGETS());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
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
    if (expandedId === widgets[index].id) setExpandedId(null);
    persist(widgets.filter((_, i) => i !== index));
  }

  function addWidget(type: (typeof DASHBOARD_WIDGET_TYPES)[number]) {
    persist([...widgets, newWidgetInstance(type)]);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAddSheetOpen(true)}
          aria-label="Add widget"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-soft transition hover:border-navy"
        >
          <PaintbrushIcon />
        </button>
        <button
          type="button"
          onClick={onDone}
          aria-label="Done"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <CheckIcon />
        </button>
      </div>

      <p className="mb-4 text-[11px] leading-snug text-ink-soft">
        This is your Dashboard — drag a tile to reorder it, tap the size badge to resize, or the gear to configure
        it. Tap the paintbrush to add more widgets.
      </p>

      {error && <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {widgets.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Your dashboard is empty. Tap the paintbrush above to add a widget.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {widgets.map((w, i) => {
            const supported = SUPPORTED_WIDTHS[w.type];
            const hasConfig =
              w.type === "summary" || LIMIT_CAPABLE_TYPES.includes(w.type) || ACCENT_CAPABLE_TYPES.includes(w.type);
            const expanded = expandedId === w.id;
            return (
              <div
                key={w.id}
                data-widget-index={i}
                onPointerDown={(e) => handlePointerDown(e, i)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: "none" }}
                className={`relative cursor-grab active:cursor-grabbing ${WIDGET_WIDTH_COLSPAN[w.width]}`}
              >
                <div
                  className={`pointer-events-none select-none rounded-card transition ${
                    dragIndex === i ? "opacity-40" : overIndex === i && dragIndex !== null ? "ring-2 ring-navy" : ""
                  }`}
                >
                  <DashboardWidgetContent widget={w} expenses={expenses} categories={categories} remaining={remaining} />
                </div>

                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeWidget(i)}
                  aria-label={`Remove ${DASHBOARD_WIDGET_INFO[w.type].title}`}
                  className="absolute -left-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow ring-2 ring-surface transition hover:bg-red-600"
                >
                  <MinusIcon />
                </button>

                <div className="absolute -right-1.5 -top-1.5 z-10 flex items-center gap-1">
                  {hasConfig && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setExpandedId(expanded ? null : w.id)}
                      aria-label={`Configure ${DASHBOARD_WIDGET_INFO[w.type].title}`}
                      className={`flex h-5 w-5 items-center justify-center rounded-full shadow ring-2 ring-surface transition ${
                        expanded ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                      }`}
                    >
                      <GearIcon />
                    </button>
                  )}
                  {supported.length > 1 && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => cycleWidth(i)}
                      title={`Size: ${w.width}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[9px] font-bold text-white shadow ring-2 ring-surface"
                    >
                      {WIDTH_LETTER[w.width]}
                    </button>
                  )}
                </div>

                {expanded && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="relative z-10 mt-2 space-y-2.5 rounded-card border border-line bg-surface p-3"
                  >
                    {w.type === "summary" && (
                      <div className="flex flex-wrap gap-1.5">
                        {SUMMARY_CARDS.map((card) => {
                          const included = (w.cards ?? [...SUMMARY_CARDS]).includes(card);
                          return (
                            <button
                              key={card}
                              type="button"
                              onClick={() => toggleCard(i, card)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                included ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                              }`}
                            >
                              {SUMMARY_CARD_LABELS[card]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {LIMIT_CAPABLE_TYPES.includes(w.type) && (
                      <div className="flex flex-wrap items-center gap-1.5">
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
                      <div className="flex flex-wrap items-center gap-1.5">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addSheetOpen && (
        <Modal onClose={() => setAddSheetOpen(false)} title="Add a widget">
          <div className="space-y-1.5">
            {DASHBOARD_WIDGET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addWidget(type)}
                className="flex w-full items-center gap-3 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3 text-left transition hover:border-surface-accent"
              >
                <WidgetThumbnail type={type} expenses={expenses} categories={categories} remaining={remaining} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-surface-foreground">
                    {DASHBOARD_WIDGET_INFO[type].title}
                  </span>
                  <span className="block truncate text-xs text-surface-foreground-soft">
                    {DASHBOARD_WIDGET_INFO[type].description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
