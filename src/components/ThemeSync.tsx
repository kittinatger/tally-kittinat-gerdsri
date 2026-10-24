"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Points every theme-color meta at the active design + theme's page background.
// These <meta> tags are rendered and owned by React (Next's metadata), so they
// must only ever be edited in place — removing or replacing them makes React
// throw "Cannot read properties of null (reading 'removeChild')" on the next
// client navigation, which breaks the whole app.
function syncThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  if (!color) return;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (meta.content !== color) meta.content = color;
  });
}

/**
 * Keeps the theme following the device's OS-level light/dark setting live,
 * for as long as the user hasn't manually picked one via the settings menu
 * (which stores an explicit choice in localStorage). Once they've toggled it
 * manually, that choice sticks and this stops applying system changes.
 *
 * Also keeps the browser/PWA status-bar color matched to the page background
 * of the active design + theme — the static metas in layout.tsx can only
 * follow the OS color scheme and know nothing about Classic vs Modern or a
 * manual theme override.
 */
export default function ThemeSync() {
  const pathname = usePathname();

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

    const observer = new MutationObserver(syncThemeColor);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-design"] });
    media.addEventListener("change", applyIfNoOverride);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", applyIfNoOverride);
    };
  }, []);

  // A navigation can render fresh metadata tags with the static colors, so
  // re-apply after every route change.
  useEffect(() => {
    syncThemeColor();
  }, [pathname]);

  return null;
}
