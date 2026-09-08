"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ANALYTICS_SECTION_IDS, type AnalyticsSectionId } from "@/lib/analytics-prefs";
import { useT } from "@/lib/language-context";

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
    </svg>
  );
}

// A basic "which sections show" checklist — deliberately NOT a full
// picker (no reordering, no per-section config, no adding/removing
// items beyond the 6 fixed sections) — the new analytics page is mostly
// fixed by design, this is its one lightweight customization knob.
export default function CustomizeSectionsMenu({
  hiddenSections,
  onToggle,
}: {
  hiddenSections: AnalyticsSectionId[];
  onToggle: (id: AnalyticsSectionId) => void;
}) {
  const t = useT();
  const sectionLabels: Record<AnalyticsSectionId, string> = {
    overview: t("analytics.sectionOverview"),
    trend: t("analytics.sectionTrend"),
    categories: t("analytics.sectionCategories"),
    netWorth: t("analytics.sectionNetWorth"),
    budgets: t("analytics.sectionBudgets"),
    forward: t("analytics.sectionForward"),
  };
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label={t("analytics.customize")}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-navy hover:text-foreground"
      >
        <GearIcon />
      </button>
      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-[60] w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-soft animate-[popover-in_0.15s_ease-out] motion-reduce:animate-none"
          >
            <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("analytics.showSections")}</p>
            {ANALYTICS_SECTION_IDS.map((id) => {
              const checked = !hiddenSections.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggle(id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-foreground transition hover:bg-[var(--nav-hover-bg)]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition ${
                      checked ? "border-navy bg-navy" : "border-line"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                      </svg>
                    )}
                  </span>
                  {sectionLabels[id]}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
