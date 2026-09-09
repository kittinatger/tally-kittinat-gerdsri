"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, AnalyticsIcon, GearIcon, PlusIcon, MembershipCardIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import { useNavStyle } from "@/lib/nav-style-context";
import { NAV_BAR_STYLES } from "@/lib/nav-bar-styles";
import BottomNavBar from "./BottomNavBar";
import NotificationBell from "./NotificationBell";

function AddIcon() {
  return <PlusIcon className="h-4 w-4 shrink-0" />;
}

// Shown on mobile only — the equivalent top nav pill / inline Add button
// (in the header below) covers this role on larger screens instead.
// Exported so each route's (server-rendered) loading.tsx can render the
// identical bar and avoid a flash while the top header/bottom nav would
// otherwise disappear and reappear across the navigation — loading.tsx
// can't pass onAddClick itself (functions can't cross the server->client
// boundary), so it uses showAdd instead to render an inert placeholder
// button. The actual bar/shape/indicator/etc. is BottomNavBar.tsx, driven
// by the user's chosen style (Settings > Nav bar style) — this just
// supplies the real links/icons and looks the style up.
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
  const navStyleId = useNavStyle();
  const bottomNavLinks = [
    { href: "/", label: t("nav.activities"), icon: <ListIcon className="h-5 w-5 shrink-0" /> },
    { href: "/analytics", label: t("nav.analytics"), icon: <AnalyticsIcon className="h-5 w-5 shrink-0" /> },
    { href: "/wallet", label: t("nav.wallet"), icon: <MembershipCardIcon className="h-5 w-5 shrink-0" /> },
    { href: "/settings", label: t("nav.settings"), icon: <GearIcon className="h-5 w-5 shrink-0" /> },
  ];

  return (
    <BottomNavBar
      config={NAV_BAR_STYLES[navStyleId]}
      links={bottomNavLinks}
      pathname={pathname}
      showAdd={showAdd}
      onAddClick={onAddClick}
    />
  );
}

export default function AppHeader({ onAddClick }: { onAddClick?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const navLinks = [
    { href: "/", label: t("nav.activities") },
    { href: "/analytics", label: t("nav.analytics") },
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
          <NotificationBell />
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="hidden items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark active:scale-[0.97] hover:-translate-y-0.5 sm:flex"
            >
              <AddIcon />
              {t("nav.add")}
            </button>
          )}
        </div>
      </header>

      {/* Mobile has no persistent top chrome otherwise (only the bottom
          nav) — this gives the bell somewhere to live below the sm
          breakpoint, where the header pill above is hidden. */}
      <NotificationBell className="fixed right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] text-ink-soft shadow-soft backdrop-blur-xl sm:hidden" />

      <BottomNav pathname={pathname} onAddClick={onAddClick} />
    </>
  );
}
