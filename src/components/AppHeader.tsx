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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          T
        </div>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-[18px] w-[18px]">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
