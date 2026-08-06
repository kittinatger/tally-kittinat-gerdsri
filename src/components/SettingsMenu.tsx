"use client";

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
      <svg viewBox="0 0 25.4297 25.3088" fill="currentColor" className="hidden h-[19px] w-[19px] dark:block">
        <path d="M13.0859 25.2277C18.5254 25.2277 22.9883 21.9464 24.9414 17.6691C25.3027 16.9171 24.834 16.38 24.0918 16.6241C23.1836 16.9464 21.6113 17.3077 20.0488 17.3077C12.4414 17.3077 8.11523 12.9816 8.11523 5.37414C8.11523 3.8507 8.4375 2.30773 8.93555 1.0675C9.25781 0.256952 8.70117-0.23133 7.91992 0.110467C3.69141 1.90734 0 6.38976 0 12.132C0 19.3585 5.86914 25.2277 13.0859 25.2277Z" />
      </svg>
      <svg viewBox="0 0 27.4805 27.1973" fill="currentColor" className="h-[19px] w-[19px] dark:hidden">
        <path d="M13.5547 4.69727C14.0723 4.69727 14.4824 4.27734 14.4824 3.76953L14.4824 0.927734C14.4824 0.419922 14.0723 0 13.5547 0C13.0469 0 12.6367 0.419922 12.6367 0.927734L12.6367 3.76953C12.6367 4.27734 13.0469 4.69727 13.5547 4.69727ZM19.834 7.31445C20.1953 7.66602 20.7812 7.68555 21.1523 7.31445L23.1641 5.30273C23.5254 4.94141 23.5156 4.3457 23.1641 3.98438C22.8027 3.63281 22.2168 3.62305 21.8555 3.98438L19.834 6.00586C19.4727 6.36719 19.4824 6.95312 19.834 7.31445ZM22.4316 13.5938C22.4316 14.1016 22.8516 14.5117 23.3594 14.5117L26.1914 14.5117C26.6992 14.5117 27.1191 14.1016 27.1191 13.5938C27.1191 13.0859 26.6992 12.666 26.1914 12.666L23.3594 12.666C22.8516 12.666 22.4316 13.0859 22.4316 13.5938ZM19.834 19.873C19.4824 20.2344 19.4727 20.8301 19.834 21.1816L21.8555 23.2031C22.2168 23.5645 22.8027 23.5449 23.1641 23.1934C23.5156 22.832 23.5254 22.2461 23.1641 21.8945L21.1426 19.873C20.7812 19.5215 20.1953 19.5215 19.834 19.873ZM13.5547 22.4902C13.0469 22.4902 12.6367 22.9004 12.6367 23.4082L12.6367 26.25C12.6367 26.7676 13.0469 27.1777 13.5547 27.1777C14.0723 27.1777 14.4824 26.7676 14.4824 26.25L14.4824 23.4082C14.4824 22.9004 14.0723 22.4902 13.5547 22.4902ZM7.28516 19.873C6.92383 19.5215 6.32812 19.5215 5.9668 19.873L3.95508 21.8848C3.59375 22.2363 3.60352 22.8223 3.94531 23.1836C4.30664 23.5352 4.90234 23.5547 5.25391 23.1934L7.27539 21.1816C7.62695 20.8301 7.62695 20.2344 7.28516 19.873ZM4.67773 13.5938C4.67773 13.0859 4.26758 12.666 3.75977 12.666L0.927734 12.666C0.419922 12.666 0 13.0859 0 13.5938C0 14.1016 0.419922 14.5117 0.927734 14.5117L3.75977 14.5117C4.26758 14.5117 4.67773 14.1016 4.67773 13.5938ZM7.27539 7.31445C7.62695 6.96289 7.62695 6.35742 7.28516 6.00586L5.26367 3.98438C4.92188 3.64258 4.32617 3.63281 3.96484 3.98438C3.61328 4.3457 3.60352 4.94141 3.95508 5.29297L5.9668 7.31445C6.32812 7.67578 6.91406 7.66602 7.27539 7.31445Z" />
        <path d="M13.5449 19.873C17.0117 19.873 19.834 17.0605 19.834 13.5938C19.834 10.127 17.0117 7.30469 13.5449 7.30469C10.0781 7.30469 7.26562 10.127 7.26562 13.5938C7.26562 17.0605 10.0781 19.873 13.5449 19.873Z" />
      </svg>
    </button>
  );
}
