"use client";

import { useEffect } from "react";
import { isIconStyleId } from "@/lib/icon-style";

const STORAGE_KEY = "tally-icon-style";

/**
 * Fetches the signed-in user's saved icon-style preference once on mount
 * and, if it differs from what's already applied (the pre-hydration
 * script in layout.tsx, or another device's more recent choice), updates
 * both localStorage and the `data-icon-style` attribute on <html>.
 *
 * Deliberately not a context provider like NavStyleProvider — nothing
 * reads this value via React. Every icon just inherits the CSS rule in
 * globals.css scoped to that attribute, which works inside server
 * components too (a context hook wouldn't). On pages with no session the
 * fetch just 401s and this silently leaves whatever's already applied.
 */
export default function IconStyleSync() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.iconStyle !== "string" || !isIconStyleId(data.iconStyle)) return;
        if (document.documentElement.getAttribute("data-icon-style") === data.iconStyle) return;
        document.documentElement.setAttribute("data-icon-style", data.iconStyle);
        try {
          localStorage.setItem(STORAGE_KEY, data.iconStyle);
        } catch {
          // Storage can be unavailable (private browsing, etc.) — the
          // attribute is still applied for this page view either way.
        }
      })
      .catch(() => {
        // Not signed in, or a transient error — leave whatever's applied.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
