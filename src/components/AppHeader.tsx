"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/activities", label: "Activities" },
  { href: "/settings", label: "Settings" },
];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v10a1 1 0 0 0 1 1H10v-6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6h3.5a1 1 0 0 0 1-1V9" />
    </svg>
  );
}

function ActivitiesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <path d="M4 20V11" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

const BOTTOM_NAV_LINKS = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/activities", label: "Activities", icon: <ActivitiesIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

function AddIcon() {
  return (
    <svg viewBox="0 0 20.918 20.5762" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M11.2305 19.5996L11.2305 0.957031C11.2305 0.439453 10.8008 0 10.2734 0C9.75586 0 9.32617 0.439453 9.32617 0.957031L9.32617 19.5996C9.32617 20.1172 9.75586 20.5566 10.2734 20.5566C10.8008 20.5566 11.2305 20.1172 11.2305 19.5996ZM0.957031 11.2305L19.5996 11.2305C20.1172 11.2305 20.5566 10.8008 20.5566 10.2832C20.5566 9.75586 20.1172 9.32617 19.5996 9.32617L0.957031 9.32617C0.439453 9.32617 0 9.75586 0 10.2832C0 10.8008 0.439453 11.2305 0.957031 11.2305Z" />
    </svg>
  );
}

// Fixed capsule nav + separate round Add button, shown on mobile only —
// the equivalent top nav pill / inline Add button (in the header below)
// covers this role on larger screens instead. The logo lives here too on
// mobile (the top header is hidden there), rather than at the top. Exported
// so each route's (server-rendered) loading.tsx can render the identical
// bar and avoid a flash while the top header/bottom nav would otherwise
// disappear and reappear across the navigation — loading.tsx can't pass
// onAddClick itself (functions can't cross the server->client boundary),
// so it uses showAdd instead to render an inert placeholder button.
export function BottomNav({
  pathname,
  showAdd = false,
  onAddClick,
}: {
  pathname: string;
  showAdd?: boolean;
  onAddClick?: () => void;
}) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-20 flex items-center gap-2 sm:hidden">
      <div
        aria-hidden="true"
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] shadow-soft backdrop-blur-xl"
      >
        <img src="/favicon-light.svg" alt="" className="h-6 w-6 shrink-0 dark:hidden" />
        <img src="/favicon-dark.svg" alt="" className="hidden h-6 w-6 shrink-0 dark:block" />
      </div>
      <nav className="flex flex-1 items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-soft backdrop-blur-xl">
        {BOTTOM_NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition ${
                active ? "bg-surface px-3.5 text-foreground shadow-sm" : "px-2 text-ink-soft hover:text-foreground"
              }`}
            >
              {link.icon}
              {active && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>
      {(showAdd || onAddClick) && (
        <button
          onClick={onAddClick}
          aria-label="Add transaction"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--fab-glass-border)] bg-[image:var(--fab-glass-bg)] text-white shadow-[var(--shadow-soft),var(--fab-glass-shadow)] backdrop-blur-xl transition hover:brightness-110"
        >
          <AddIcon />
        </button>
      )}
    </div>
  );
}

export default function AppHeader({ onAddClick }: { onAddClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-3 z-10 hidden items-center justify-between gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3 py-2 shadow-soft backdrop-blur-xl sm:flex sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/favicon-light.svg" alt="Tally" className="h-8 w-8 shrink-0 dark:hidden" />
          <img src="/favicon-dark.svg" alt="Tally" className="hidden h-8 w-8 shrink-0 dark:block" />
          <h1 className="hidden font-display text-lg text-foreground min-[420px]:block">Tally</h1>
        </div>

        <nav className="hidden items-center gap-1 rounded-full bg-bg-soft p-1 sm:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-sm ${
                  active ? "bg-surface text-foreground shadow-sm" : "text-ink-soft hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="hidden items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark hover:-translate-y-0.5 sm:flex"
            >
              <AddIcon />
              Add
            </button>
          )}
        </div>
      </header>

      <BottomNav pathname={pathname} onAddClick={onAddClick} />
    </>
  );
}
