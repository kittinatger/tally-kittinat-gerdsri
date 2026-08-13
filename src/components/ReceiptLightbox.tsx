"use client";

import { useEffect } from "react";

/**
 * Full-screen image viewer with an explicit close button, layered above the
 * modal it's opened from. Receipts used to open via a plain `target="_blank"`
 * link — in an installed PWA that navigates the app's own single webview
 * with no browser chrome, no back button, and no way out except force-
 * quitting. This renders in-app instead, so there's always a way to close it.
 */
export default function ReceiptLightbox({ src, onClose }: { src: string; onClose: () => void }) {
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <svg viewBox="0 0 20.1197 19.7779" fill="currentColor" className="h-4 w-4">
          <path d="M18.1262 0.303967L0.27467 18.1555C-0.0866577 18.5169-0.0964233 19.1321 0.27467 19.5032C0.65553 19.8645 1.261 19.8645 1.63209 19.5032L19.4739 1.65162C19.845 1.2903 19.8547 0.675061 19.4739 0.303967C19.1028-0.0573608 18.4973-0.0671265 18.1262 0.303967ZM19.4739 18.1555L1.63209 0.303967C1.261-0.0573608 0.645764-0.0671265 0.27467 0.303967C-0.0866577 0.684827-0.0866577 1.2903 0.27467 1.65162L18.1262 19.5032C18.4876 19.8645 19.1126 19.8743 19.4739 19.5032C19.845 19.1223 19.845 18.5169 19.4739 18.1555Z" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Receipt"
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
