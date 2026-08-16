"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import { normalizeExpenseType, normalizeDirection, type Expense } from "@/types/expense";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import {
  DASHBOARD_WIDGET_TYPES,
  DASHBOARD_WIDGET_INFO_KEYS,
  DEFAULT_DASHBOARD_WIDGETS,
  SUMMARY_CARDS,
  SUMMARY_CARD_LABEL_KEYS,
  WIDGET_ACCENTS,
  WIDGET_WIDTH_COLSPAN,
  WIDGET_WIDTH_LABEL_KEYS,
  SUPPORTED_WIDTHS,
  LIMIT_OPTIONS,
  ACCENT_CAPABLE_TYPES,
  LIMIT_CAPABLE_TYPES,
  ACTION_HIDABLE_TYPES,
  WALLET_CAPABLE_TYPES,
  WIDGET_CATEGORIES,
  WIDGET_CATEGORY_LABEL_KEYS,
  WIDGET_CATEGORY_OF,
  newWidgetInstance,
  type DashboardWidgetInstance,
  type SummaryCardId,
  type WidgetAccent,
  type WidgetCategory,
} from "@/lib/dashboard-widgets";
import { dotClasses } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";
import DashboardWidgetContent from "./DashboardWidgetContent";
import Modal from "./Modal";

const WIDTH_LETTER = { small: "S", medium: "M", large: "L" } as const;

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function PaintbrushIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15.5 2.5a2.5 2.5 0 0 1 0 3.5L8 13.5l-3.5-3.5L12 3a2.5 2.5 0 0 1 3.5-.5Z" />
      <path d="M6 12 3 15c-.8.8-.8 2.2 0 3 .8.8 2.2.8 3 0l3-3" />
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

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <circle cx="7" cy="5" r="1.4" />
      <circle cx="13" cy="5" r="1.4" />
      <circle cx="7" cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="13" cy="15" r="1.4" />
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
  categories,
  remaining,
  wallets,
  onDone,
}: {
  categories: CategoryOption[];
  remaining: number;
  wallets: WalletOption[];
  onDone: () => void;
}) {
  const t = useT();
  const [widgets, setWidgets] = useState<DashboardWidgetInstance[]>(() => DEFAULT_DASHBOARD_WIDGETS());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const tileRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<WidgetCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The live previews below are the only thing here that need real expense
  // data — fetched on mount here rather than by the Settings page itself, so
  // opening Settings for anything else (the common case) doesn't pay for a
  // potentially-large transaction list it won't use.
  const [expenses, setExpenses] = useState<Expense[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data.expenses)) return;
        setExpenses(
          data.expenses.map(
            (e: Record<string, unknown>): Expense => ({
              id: e.id as number,
              type: normalizeExpenseType(e.type as string),
              direction: normalizeDirection(e.direction as string | null),
              date: e.date as string,
              amount: Number(e.amount),
              merchant: e.merchant as string,
              category: e.category as string,
              notes: e.notes as string | null,
              tags: (e.tags as string[]) ?? [],
              hasReceipt: (e.has_receipt as boolean) ?? false,
              walletId: (e.wallet_id as number | null) ?? null,
              walletName: (e.wallet_name as string | null) ?? null,
              splitGroupId: (e.split_group_id as string | null) ?? null,
            }),
          ),
        );
      })
      .catch(() => {
        // Widget previews just render with no data; not worth surfacing an error for.
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
    } catch (err) {
      setWidgets(previous);
      setError(describeFetchError(err));
    }
  }

  // Pointer Events (not HTML5 drag-and-drop) so this works with touch as
  // well as mouse — native HTML5 DnD never fires from a touch gesture.
  function handlePointerDown(e: React.PointerEvent, index: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
    setOverIndex(index);
  }

  // Deliberately not using document.elementFromPoint here: once a pointer is
  // captured (see handlePointerDown), several browsers — iOS Safari in
  // particular — make elementFromPoint always resolve to the capturing
  // element regardless of where the pointer actually is, which silently
  // broke reordering (overIndex never left dragIndex, so the drop condition
  // in handlePointerUp never fired). Checking each tile's own bounding rect
  // sidesteps that hit-testing quirk entirely.
  function handlePointerMove(e: React.PointerEvent) {
    if (dragIndex === null) return;
    for (const [idx, el] of tileRefs.current) {
      const rect = el.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        setOverIndex(idx);
        return;
      }
    }
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

  function toggleHideAction(index: number) {
    persist(widgets.map((w, i) => (i === index ? { ...w, hideAction: !w.hideAction } : w)));
  }

  function setWidgetWalletId(index: number, walletId: number | null) {
    persist(widgets.map((w, i) => (i === index ? { ...w, walletId: walletId ?? undefined } : w)));
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
          aria-label={t("dashboardWidgets.addWidgetAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-soft transition hover:border-navy"
        >
          <PaintbrushIcon />
        </button>
        <button
          type="button"
          onClick={onDone}
          aria-label={t("dashboardWidgets.doneAria")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <CheckIcon />
        </button>
      </div>

      <p className="mb-4 text-[11px] leading-snug text-ink-soft">
        {t("dashboardWidgets.intro")}
      </p>

      {error && <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {widgets.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          {t("dashboardWidgets.emptyState")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {widgets.map((w, i) => {
            const supported = SUPPORTED_WIDTHS[w.type];
            const hasConfig =
              w.type === "summary" ||
              LIMIT_CAPABLE_TYPES.includes(w.type) ||
              ACCENT_CAPABLE_TYPES.includes(w.type) ||
              ACTION_HIDABLE_TYPES.includes(w.type) ||
              WALLET_CAPABLE_TYPES.includes(w.type);
            const expanded = expandedId === w.id;
            return (
              <div
                key={w.id}
                data-widget-index={i}
                ref={(el) => {
                  if (el) tileRefs.current.set(i, el);
                  else tileRefs.current.delete(i);
                }}
                className={`relative ${WIDGET_WIDTH_COLSPAN[w.width]}`}
              >
                <div
                  className={`pointer-events-none select-none rounded-card transition ${
                    dragIndex === i ? "opacity-40" : overIndex === i && dragIndex !== null ? "ring-2 ring-navy" : ""
                  }`}
                >
                  <DashboardWidgetContent widget={w} expenses={expenses} categories={categories} remaining={remaining} />
                </div>

                {/* Dedicated drag handle rather than the whole tile — touchAction:
                    "none" here is what makes reordering work with a touch drag,
                    but applying it to the entire card would also swallow a plain
                    vertical scroll gesture that happens to start on a widget.
                    userSelect/webkitTouchCallout: "none" stop iOS Safari from
                    treating a press-and-hold on the handle as the start of a
                    text-selection gesture (its loupe/selection UI), which is
                    confusing mid-drag and fights the pointer capture below. */}
                <button
                  type="button"
                  onPointerDown={(e) => handlePointerDown(e, i)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  aria-label={`${t("dashboardWidgets.reorderPrefix")} ${t(DASHBOARD_WIDGET_INFO_KEYS[w.type].titleKey)}`}
                  className="absolute -bottom-2 left-1/2 z-10 flex h-7 w-11 -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-bg-soft text-ink-soft shadow ring-2 ring-surface transition hover:text-foreground active:cursor-grabbing"
                >
                  <GripIcon />
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeWidget(i)}
                  aria-label={`${t("dashboardWidgets.removePrefix")} ${t(DASHBOARD_WIDGET_INFO_KEYS[w.type].titleKey)}`}
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
                      aria-label={`${t("dashboardWidgets.configurePrefix")} ${t(DASHBOARD_WIDGET_INFO_KEYS[w.type].titleKey)}`}
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
                      title={`${t("dashboardWidgets.sizePrefix")}: ${t(WIDGET_WIDTH_LABEL_KEYS[w.width])}`}
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
                              {t(SUMMARY_CARD_LABEL_KEYS[card])}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {LIMIT_CAPABLE_TYPES.includes(w.type) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ink-soft">{t("dashboardWidgets.show")}</span>
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
                        <span className="text-[11px] font-semibold text-ink-soft">{t("dashboardWidgets.color")}</span>
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

                    {WALLET_CAPABLE_TYPES.includes(w.type) && wallets.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ink-soft">{t("dashboardWidgets.wallet")}</span>
                        <button
                          type="button"
                          onClick={() => setWidgetWalletId(i, null)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            w.walletId == null ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                          }`}
                        >
                          {t("dashboardWidgets.allWallets")}
                        </button>
                        {wallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            type="button"
                            onClick={() => setWidgetWalletId(i, wallet.id)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                              w.walletId === wallet.id ? "bg-navy text-white" : "bg-bg-soft text-ink-soft hover:text-foreground"
                            }`}
                          >
                            {wallet.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {ACTION_HIDABLE_TYPES.includes(w.type) && (
                      <label className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-ink-soft">{t("dashboardWidgets.quickActionButton")}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!w.hideAction}
                          onClick={() => toggleHideAction(i)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                            w.hideAction ? "bg-bg-soft" : "bg-navy"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                              w.hideAction ? "left-0.5" : "left-[18px]"
                            }`}
                          />
                        </button>
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addSheetOpen && (
        <Modal
          onClose={() => {
            setAddSheetOpen(false);
            setAddCategory(null);
          }}
          title={addCategory ? t(WIDGET_CATEGORY_LABEL_KEYS[addCategory]) : t("dashboardWidgets.addAWidgetTitle")}
        >
          {addCategory === null ? (
            <div className="space-y-1.5">
              {WIDGET_CATEGORIES.map((cat) => {
                const count = DASHBOARD_WIDGET_TYPES.filter((type) => WIDGET_CATEGORY_OF[type] === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddCategory(cat)}
                    className="flex w-full items-center justify-between gap-3 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3 text-left transition hover:border-surface-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-surface-foreground">
                        {t(WIDGET_CATEGORY_LABEL_KEYS[cat])}
                      </span>
                      <span className="block truncate text-xs text-surface-foreground-soft">
                        {count} {count === 1 ? t("dashboardWidgets.widgetSingular") : t("dashboardWidgets.widgetPlural")}
                      </span>
                    </span>
                    <ChevronRightIcon />
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setAddCategory(null)}
                className="mb-3 flex items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
              >
                <BackIcon />
                {t("dashboardWidgets.categoriesBack")}
              </button>
              <div className="space-y-1.5">
                {DASHBOARD_WIDGET_TYPES.filter((type) => WIDGET_CATEGORY_OF[type] === addCategory).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addWidget(type)}
                    className="flex w-full items-center gap-3 rounded-card border border-surface-line bg-surface-soft px-3.5 py-3 text-left transition hover:border-surface-accent"
                  >
                    <WidgetThumbnail type={type} expenses={expenses} categories={categories} remaining={remaining} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-surface-foreground">
                        {t(DASHBOARD_WIDGET_INFO_KEYS[type].titleKey)}
                      </span>
                      <span className="block truncate text-xs text-surface-foreground-soft">
                        {t(DASHBOARD_WIDGET_INFO_KEYS[type].descKey)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
