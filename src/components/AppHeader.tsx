"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/activities", label: "Activities" },
  { href: "/settings", label: "Settings" },
];

export default function AppHeader({ onAddClick }: { onAddClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-3 z-10 flex items-center justify-between gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3 py-2 shadow-soft backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-2.5">
      <div className="flex shrink-0 items-center gap-2">
        <img src="/favicon-light.svg" alt="Tally" className="h-8 w-8 shrink-0 dark:hidden" />
        <img src="/favicon-dark.svg" alt="Tally" className="hidden h-8 w-8 shrink-0 dark:block" />
        <h1 className="hidden font-display text-lg text-foreground min-[420px]:block">Tally</h1>
      </div>

      <nav className="flex items-center gap-1 rounded-full bg-bg-soft p-1">
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
            + Add
          </button>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60 sm:px-3.5"
        >
          <svg viewBox="0 0 32.5293 26.9238" fill="currentColor" className="h-[18px] w-[18px]">
            <path d="M22.6172 5.21484L22.6172 10.4004L20.8887 10.4004L20.8887 5.20508C20.8887 2.98828 19.6387 1.73828 17.4219 1.73828L6.85547 1.73828C4.62891 1.73828 3.38867 2.98828 3.38867 5.20508L3.38867 21.7188C3.38867 23.9453 4.62891 25.1953 6.85547 25.1953L17.4219 25.1953C19.6387 25.1953 20.8887 23.9453 20.8887 21.7188L20.8887 16.5137L22.6172 16.5137L22.6172 21.7188C22.6172 25.0684 20.7617 26.9238 17.4219 26.9238L6.86523 26.9238C3.51562 26.9238 1.65039 25.0684 1.65039 21.7188L1.65039 5.21484C1.65039 1.86523 3.51562 0.00976562 6.86523 0.00976562L17.4219 0.00976562C20.7617 0.00976562 22.6172 1.86523 22.6172 5.21484Z" />
            <path d="M12.334 13.457C12.334 13.916 12.7148 14.3066 13.1641 14.3066L26.2793 14.3066L29.3945 14.1797C29.7949 14.1602 30.127 13.8477 30.127 13.457C30.127 13.0566 29.7949 12.7441 29.3945 12.7246L26.2793 12.5977L13.1641 12.5977C12.7148 12.5977 12.334 12.9883 12.334 13.457ZM24.834 9.16992C24.834 9.375 24.9219 9.60938 25.0977 9.76562L27.3242 11.8848L28.9746 13.457L27.3242 15.0098L25.0977 17.1387C24.9219 17.2949 24.834 17.5195 24.834 17.7246C24.834 18.1641 25.1562 18.5059 25.5957 18.5059C25.8203 18.5059 25.9961 18.418 26.1621 18.252L30.2246 14.0723C30.4395 13.8574 30.5078 13.6719 30.5078 13.457C30.5078 13.2324 30.4395 13.0469 30.2246 12.832L26.1621 8.65234C25.9961 8.48633 25.8203 8.38867 25.5957 8.38867C25.1562 8.38867 24.834 8.7207 24.834 9.16992Z" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
