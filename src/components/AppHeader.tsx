"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ListIcon, GearIcon, PlusIcon, MembershipCardIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";

function AddIcon() {
  return <PlusIcon className="h-4 w-4 shrink-0" />;
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
  const t = useT();
  const bottomNavLinks = [
    { href: "/", label: t("nav.home"), icon: <HomeIcon className="h-5 w-5 shrink-0" /> },
    { href: "/activities", label: t("nav.activities"), icon: <ListIcon className="h-5 w-5 shrink-0" /> },
    { href: "/wallet", label: t("nav.wallet"), icon: <MembershipCardIcon className="h-5 w-5 shrink-0" /> },
    { href: "/settings", label: t("nav.settings"), icon: <GearIcon className="h-5 w-5 shrink-0" /> },
  ];

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
        {bottomNavLinks.map((link) => {
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
  const t = useT();
  const navLinks = [
    { href: "/", label: t("nav.dashboard") },
    { href: "/activities", label: t("nav.activities") },
    { href: "/wallet", label: t("nav.wallet") },
    { href: "/settings", label: t("nav.settings") },
  ];

  return (
    <>
      <header className="sticky top-3 z-10 hidden items-center justify-between gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3 py-2 shadow-soft backdrop-blur-xl sm:flex sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/favicon-light.svg" alt="Tally" className="h-8 w-8 shrink-0 dark:hidden" />
          <img src="/favicon-dark.svg" alt="Tally" className="hidden h-8 w-8 shrink-0 dark:block" />
          <h1 className="hidden font-display text-lg text-foreground min-[420px]:block">Tally</h1>
        </div>

        <nav className="hidden items-center gap-1 rounded-full bg-bg-soft p-1 sm:flex">
          {navLinks.map((link) => {
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
              {t("nav.add")}
            </button>
          )}
        </div>
      </header>

      <BottomNav pathname={pathname} onAddClick={onAddClick} />
    </>
  );
}
