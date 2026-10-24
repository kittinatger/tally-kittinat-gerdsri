"use client";

import { useEffect } from "react";

/**
 * Keeps the theme following the device's OS-level light/dark setting live,
 * for as long as the user hasn't manually picked one via the settings menu
 * (which stores an explicit choice in localStorage). Once they've toggled it
 * manually, that choice sticks and this stops applying system changes.
 *
 * Also keeps the browser/PWA status-bar color (<meta name="theme-color">)
 * matched to the page background of the active design + theme. The static
 * metas in layout.tsx can only follow the OS color scheme and know nothing
 * about Classic vs Modern or a manual theme override, so without this the
 * status bar renders as a visibly different band above the header.
 */
export default function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyIfNoOverride() {
      let override: string | null = null;
      try {
        override = localStorage.getItem("tally-theme");
      } catch {
        // Storage can be unavailable (private browsing, etc.) — treat as no override.
      }
      if (override === "light" || override === "dark") return;
      root.setAttribute("data-theme", media.matches ? "dark" : "light");
    }

    function syncThemeColor() {
      const color = getComputedStyle(root).getPropertyValue("--background").trim();
      if (!color) return;
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = color;
      document.head.appendChild(meta);
    }

    syncThemeColor();
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-design"] });
    media.addEventListener("change", applyIfNoOverride);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", applyIfNoOverride);
    };
  }, []);

  return null;
}
