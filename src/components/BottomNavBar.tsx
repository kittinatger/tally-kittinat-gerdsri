"use client";

import Link from "next/link";
import { PlusIcon } from "@/lib/icons";

export type NavBarLink = { href: string; label: string; icon: React.ReactNode };

// The mobile bottom nav, in the active design's look:
// - classic: a floating frosted pill beside the app mark, the active tab a
//   filled chip showing its label, and the Add button as a separate round
//   button on the right.
// - modern: a full-width bar flush with the bottom edge (positioned and
//   flattened by globals.css via data-bottom-nav), every label shown, the
//   active tab marked with an accent pill, and Add inline in the middle.
export default function BottomNavBar({
  variant,
  links,
  pathname,
  showAdd = false,
  onAddClick,
}: {
  variant: "classic" | "modern";
  links: NavBarLink[];
  pathname: string;
  showAdd?: boolean;
  onAddClick?: () => void;
}) {
  const hasAdd = showAdd || Boolean(onAddClick);

  if (variant === "modern") {
    const leftLinks = hasAdd ? links.slice(0, 2) : links;
    const rightLinks = hasAdd ? links.slice(2) : [];
    return (
      <div data-bottom-nav="modern" className="fixed inset-x-3 bottom-3 z-20 flex items-center gap-2 sm:hidden">
        <nav className="relative flex flex-1 items-center gap-1 p-1.5">
          {leftLinks.map((link) => (
            <ModernTab key={link.href} link={link} active={link.href === pathname} />
          ))}
          {hasAdd && (
            <div className="flex w-10 shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={onAddClick}
                aria-label="Add transaction"
                data-nav-cta
                className="flex h-11 w-11 shrink-0 items-center justify-center transition"
              >
                <PlusIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          )}
          {rightLinks.map((link) => (
            <ModernTab key={link.href} link={link} active={link.href === pathname} />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-20 flex items-center gap-2 sm:hidden">
      <div
        aria-hidden="true"
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] shadow-soft backdrop-blur-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG mark, not a build-time asset */}
        <img src="/favicon-light.svg" alt="" className="h-6 w-6 shrink-0 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG mark, not a build-time asset */}
        <img src="/favicon-dark.svg" alt="" className="hidden h-6 w-6 shrink-0 dark:block" />
      </div>

      <nav className="relative flex flex-1 items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] p-1.5 shadow-soft backdrop-blur-xl">
        {links.map((link) => {
          const active = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
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

      {hasAdd && (
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add transaction"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--fab-glass-border)] bg-[image:var(--fab-glass-bg)] text-white shadow-[var(--shadow-soft),var(--fab-glass-shadow)] backdrop-blur-xl transition hover:brightness-110"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
        </button>
      )}
    </div>
  );
}

function ModernTab({ link, active }: { link: NavBarLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition"
    >
      {link.icon}
      <span>{link.label}</span>
    </Link>
  );
}
