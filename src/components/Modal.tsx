"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

export default function Modal({
  onClose,
  title,
  children,
  wide = false,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider desktop cap (sm:max-w-2xl instead of sm:max-w-md) for content
   * that has its own dedicated two-column desktop layout — e.g. the
   * transaction form. No effect below the sm breakpoint, where every modal
   * is a full-width bottom sheet regardless. */
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // On mobile, the on-screen keyboard can cover the bottom of a long form
    // (this modal is a bottom sheet, and forms like Add/Edit transaction
    // have 15+ fields) — including the field you just tapped, or the submit
    // button below it, with no obvious cue to scroll. Scrolling the focused
    // field into view once the keyboard has finished animating in fixes the
    // field itself; a resize listener re-centers it if the keyboard's final
    // height only becomes known after that (iOS reports it late).
    function scrollFocusedIntoView() {
      const active = document.activeElement;
      if (active instanceof HTMLElement && panel?.contains(active)) {
        active.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    function onFocusIn(e: FocusEvent) {
      if (!(e.target instanceof HTMLElement)) return;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      setTimeout(scrollFocusedIntoView, 300);
    }

    panel.addEventListener("focusin", onFocusIn);
    window.visualViewport?.addEventListener("resize", scrollFocusedIntoView);
    return () => {
      panel.removeEventListener("focusin", onFocusIn);
      window.visualViewport?.removeEventListener("resize", scrollFocusedIntoView);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--modal-glass-border)] bg-[image:var(--modal-glass-bg)] p-5 shadow-[var(--modal-panel-shadow)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-surface-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
