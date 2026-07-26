"use client";

import { useEffect } from "react";

/**
 * Keeps the theme following the device's OS-level light/dark setting live,
 * for as long as the user hasn't manually picked one via the settings menu
 * (which stores an explicit choice in localStorage). Once they've toggled it
 * manually, that choice sticks and this stops applying system changes.
 */
export default function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyIfNoOverride() {
      let override: string | null = null;
      try {
        override = localStorage.getItem("tally-theme");
      } catch {
        // Storage can be unavailable (private browsing, etc.) — treat as no override.
      }
      if (override === "light" || override === "dark") return;
      document.documentElement.setAttribute("data-theme", media.matches ? "dark" : "light");
    }

    media.addEventListener("change", applyIfNoOverride);
    return () => media.removeEventListener("change", applyIfNoOverride);
  }, []);

  return null;
}
