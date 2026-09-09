"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, DESKTOP_QUERY } from "@/lib/use-media-query";

// Chord/single-key global shortcuts, desktop only — same DESKTOP_QUERY gate
// as CommandPalette.tsx (Ctrl/Cmd+K lives there, alongside its own state;
// this component owns the rest: the "g then <letter>" navigation chords,
// "c" to start a new transaction, and "?" to open the shortcuts list in
// Settings). See KeyboardShortcutsPanel.tsx for the full, user-facing list.
export default function KeyboardShortcuts() {
  const router = useRouter();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const pendingG = useRef(false);
  const pendingGTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }

    function clearPendingG() {
      pendingG.current = false;
      if (pendingGTimer.current) {
        clearTimeout(pendingGTimer.current);
        pendingGTimer.current = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd+K is CommandPalette's own shortcut — leave it alone here.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (pendingG.current) {
        clearPendingG();
        const key = e.key.toLowerCase();
        const dest =
          key === "a" ? "/" : key === "n" ? "/analytics" : key === "w" ? "/wallet" : key === "s" ? "/settings" : null;
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        pendingG.current = true;
        pendingGTimer.current = setTimeout(clearPendingG, 1200);
        return;
      }

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        router.push("/?add=expense");
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        router.push("/settings?panel=keyboardShortcuts");
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearPendingG();
    };
  }, [isDesktop, router]);

  return null;
}
