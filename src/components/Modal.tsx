"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

export default function Modal({
  onClose,
  title,
  children,
  wide = false,
  headerRight,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider desktop cap (sm:max-w-2xl instead of sm:max-w-md) for content
   * that has its own dedicated two-column desktop layout — e.g. the
   * transaction form. No effect below the sm breakpoint, where every modal
   * is a full-width bottom sheet regardless. */
  wide?: boolean;
  /** Extra control rendered in the header row, between the title and the
   * close button — e.g. an overflow ("...") menu button for actions like
   * Edit that shouldn't be a permanently-visible button in the body. */
  headerRight?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Locking body alone isn't enough: the page's scrolling element is
    // <html> (documentElement), not <body>, so with a tall page behind the
    // modal (e.g. a long Settings list) the browser's own page scrollbar
    // stayed active and rendered at the true viewport edge — outside the
    // modal's rounded panel — which read as a scrollbar "escaping" the
    // dialog. Locking both stops the page itself from scrolling at all.
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
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

  // Portaled to document.body — a modal opened from inside a scrolling
  // pane that itself establishes a containing block for fixed-position
  // descendants (e.g. Settings' desktop two-pane layout, whose detail
  // pane is `lg:sticky ... lg:overflow-y-auto`) would otherwise have its
  // `fixed inset-0` overlay clipped/positioned relative to that pane
  // instead of the real viewport — the page's own sticky nav header (which
  // sits outside that pane) then paints on top of it instead of under it.
  // Same fix already applied to CardPhotoScanModal for the equivalent
  // backdrop-blur-ancestor case; see that file's comment for the general
  // mechanism.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[92dvh] w-full overflow-hidden rounded-t-[28px] border border-[var(--modal-glass-border)] bg-[image:var(--modal-glass-bg)] shadow-[var(--modal-panel-shadow)] backdrop-blur-xl sm:rounded-[28px] ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The scrollbar lives on this inner scrolling div, not the rounded
         * outer panel — a straight-edged scrollbar drawn against a rounded
         * corner pokes out past the curve at the top/bottom of the panel.
         * overflow-hidden on the outer div clips it back to the rounded
         * shape. */}
        <div ref={panelRef} className="max-h-[92dvh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate font-display text-xl text-surface-foreground">{title}</h2>
            <div className="flex shrink-0 items-center gap-1">
              {headerRight}
              <button
                onClick={onClose}
                aria-label={t("common.close")}
                className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
