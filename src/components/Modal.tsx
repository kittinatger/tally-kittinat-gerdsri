"use client";

import { useEffect } from "react";

export default function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--modal-glass-border)] bg-[image:var(--modal-glass-bg)] p-5 shadow-[var(--modal-panel-shadow)] backdrop-blur-xl sm:max-w-md sm:rounded-[28px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-surface-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-surface-foreground-soft transition hover:bg-[var(--surface-nav-hover)] hover:text-surface-foreground"
          >
            <svg viewBox="0 0 20.1197 19.7779" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M18.1262 0.303967L0.27467 18.1555C-0.0866577 18.5169-0.0964233 19.1321 0.27467 19.5032C0.65553 19.8645 1.261 19.8645 1.63209 19.5032L19.4739 1.65162C19.845 1.2903 19.8547 0.675061 19.4739 0.303967C19.1028-0.0573608 18.4973-0.0671265 18.1262 0.303967ZM19.4739 18.1555L1.63209 0.303967C1.261-0.0573608 0.645764-0.0671265 0.27467 0.303967C-0.0866577 0.684827-0.0866577 1.2903 0.27467 1.65162L18.1262 19.5032C18.4876 19.8645 19.1126 19.8743 19.4739 19.5032C19.845 19.1223 19.845 18.5169 19.4739 18.1555Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
