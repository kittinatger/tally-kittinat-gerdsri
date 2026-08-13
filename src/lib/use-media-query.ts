"use client";

import { useCallback, useSyncExternalStore } from "react";

// Matches Tailwind's `lg:` breakpoint — the split point this app uses for
// "different information architecture on desktop" (two-pane Activities/
// Settings), as opposed to `sm:` which is used throughout for ordinary
// responsive reflow of a single shared layout.
export const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Tracks a CSS media query in JS — used where a component needs to decide
 * WHICH component to mount per breakpoint (e.g. a modal overlay on mobile
 * vs. an inline pane on desktop), not just how to style one already-mounted
 * tree (Tailwind responsive classes handle that case directly and should be
 * preferred whenever both variants can coexist in the DOM).
 *
 * Built on useSyncExternalStore (React's recommended way to subscribe to a
 * browser API like matchMedia) rather than useState+useEffect, so there's no
 * synchronous setState-in-effect and no extra render pass. The server
 * snapshot is always `false` — matches the mobile-first default every other
 * breakpoint in this app assumes, so hydration never disagrees with the
 * server-rendered markup.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
