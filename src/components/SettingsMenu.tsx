"use client";

import { SunMoonIcon } from "@/lib/icons";

// Only rendered on the pre-login pages (login/register/forgot-password/
// reset-password — see each page.tsx) where there's no session yet. It used
// to open the full authenticated settings panel, including Currency and
// auto-convert toggles that call an authenticated API and would silently
// fail with no session; now it's just the one setting that actually makes
// sense before signing in.
//
// Renders both icons always and lets the `dark:` CSS variant (keyed off
// <html data-theme>, see globals.css) pick which one shows — a layout.tsx
// blocking script sets that attribute before hydration to avoid a
// flash-of-wrong-theme, which means it's already correct by the time this
// component hydrates but wasn't available during the server render. Reading
// it into React state (as this used to) made the very first client render
// disagree with the server-rendered HTML and threw a hydration error; CSS
// visibility has no such mismatch since both icons render identically on
// server and client.
export default function SettingsMenu() {
  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tally-theme", next);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the toggle
      // still works for the current session either way.
    }
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
    >
      <SunMoonIcon className="h-[19px] w-[19px]" />
    </button>
  );
}
