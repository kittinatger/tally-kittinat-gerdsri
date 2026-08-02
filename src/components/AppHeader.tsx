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
    <svg viewBox="0 0 29.8242 26.2207" fill="currentColor" className="h-5 w-5 shrink-0">
      <path d="M11.3086 24.4727L11.3086 16.9238C11.3086 16.377 11.6699 16.0254 12.2168 16.0254L17.2559 16.0254C17.8027 16.0254 18.1543 16.377 18.1543 16.9238L18.1543 24.4727ZM3.73047 23.5645C3.73047 25.2246 4.72656 26.2012 6.40625 26.2012L23.0566 26.2012C24.7363 26.2012 25.7324 25.2246 25.7324 23.5645L25.7324 13.0566L15.498 4.47266C15 4.04297 14.4336 4.0625 13.9551 4.47266L3.73047 13.0371ZM0.927734 13.0176C1.2207 13.0176 1.46484 12.8613 1.67969 12.6758L14.2578 2.11914C14.4043 1.99219 14.5703 1.93359 14.7266 1.93359C14.8926 1.93359 15.0586 1.99219 15.2051 2.11914L27.7832 12.6758C27.998 12.8613 28.2324 13.0176 28.5352 13.0176C29.1113 13.0176 29.4629 12.5977 29.4629 12.168C29.4629 11.9043 29.3555 11.6504 29.1113 11.4453L16.1426 0.566406C15.6934 0.185547 15.2148 0 14.7266 0C14.248 0 13.7695 0.185547 13.3203 0.566406L0.351562 11.4453C0.107422 11.6504 0 11.9043 0 12.168C0 12.5977 0.341797 13.0176 0.927734 13.0176ZM23.0566 6.9043L25.9277 9.32617L25.9277 3.76953C25.9277 3.28125 25.6055 2.96875 25.1172 2.96875L23.877 2.96875C23.3887 2.96875 23.0566 3.28125 23.0566 3.76953Z" />
    </svg>
  );
}

function ActivitiesIcon() {
  return (
    <svg viewBox="0 0 21.3281 27.5959" fill="currentColor" className="h-5 w-5 shrink-0">
      <path d="M0 26.254C0 27.4259 1.23047 28.0118 2.36328 27.2599L4.01367 26.2442L5.75195 27.377C6.05469 27.5724 6.30859 27.5821 6.61133 27.377L8.30078 26.2345L10.0391 27.377C10.3418 27.5821 10.5957 27.5821 10.9082 27.377L12.6465 26.2345L14.3359 27.377C14.6582 27.5919 14.873 27.5919 15.1953 27.377L16.9434 26.2345L18.6035 27.2599C19.7266 28.0118 20.9668 27.4259 20.9668 26.254L20.9668 4.10555C20.9668 1.60555 19.6973 0.345788 17.168 0.345788L3.79883 0.345788C1.26953 0.345788 0 1.60555 0 4.10555ZM5.03906 7.33798C4.63867 7.33798 4.33594 7.03524 4.33594 6.63485C4.33594 6.24423 4.63867 5.93173 5.03906 5.93173L11.6309 5.93173C12.0508 5.93173 12.3535 6.24423 12.3535 6.63485C12.3535 7.03524 12.0508 7.33798 11.6309 7.33798ZM14.8145 7.33798C14.4141 7.33798 14.1113 7.03524 14.1113 6.63485C14.1113 6.24423 14.4141 5.93173 14.8145 5.93173L15.8984 5.93173C16.3086 5.93173 16.6113 6.24423 16.6113 6.63485C16.6113 7.03524 16.3086 7.33798 15.8984 7.33798ZM5.03906 11.9474C4.63867 11.9474 4.33594 11.6446 4.33594 11.2638C4.33594 10.8536 4.63867 10.5411 5.03906 10.5411L11.6309 10.5411C12.0508 10.5411 12.3535 10.8536 12.3535 11.2638C12.3535 11.6446 12.0508 11.9474 11.6309 11.9474ZM14.8145 11.9474C14.4141 11.9474 14.1113 11.6446 14.1113 11.2638C14.1113 10.8536 14.4141 10.5411 14.8145 10.5411L15.8984 10.5411C16.3086 10.5411 16.6113 10.8536 16.6113 11.2638C16.6113 11.6446 16.3086 11.9474 15.8984 11.9474ZM5.03906 16.4884C4.63867 16.4884 4.33594 16.1856 4.33594 15.795C4.33594 15.3946 4.63867 15.0821 5.03906 15.0821L11.6602 15.0821C12.0801 15.0821 12.3828 15.3946 12.3828 15.795C12.3828 16.1856 12.0801 16.4884 11.6602 16.4884ZM14.7852 16.4884C14.3848 16.4884 14.082 16.1856 14.082 15.795C14.082 15.3946 14.3848 15.0821 14.7852 15.0821L15.8984 15.0821C16.3086 15.0821 16.6113 15.3946 16.6113 15.795C16.6113 16.1856 16.3086 16.4884 15.8984 16.4884ZM5.03906 21.0977C4.63867 21.0977 4.33594 20.795 4.33594 20.4141C4.33594 20.0138 4.63867 19.7013 5.03906 19.7013L11.6602 19.7013C12.0801 19.7013 12.3828 20.0138 12.3828 20.4141C12.3828 20.795 12.0801 21.0977 11.6602 21.0977ZM14.7852 21.0977C14.3848 21.0977 14.082 20.795 14.082 20.4141C14.082 20.0138 14.3848 19.7013 14.7852 19.7013L15.8984 19.7013C16.3086 19.7013 16.6113 20.0138 16.6113 20.4141C16.6113 20.795 16.3086 21.0977 15.8984 21.0977Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 26.5527 26.2012" fill="currentColor" className="h-5 w-5 shrink-0">
      <path d="M11.9141 26.2012L14.2773 26.2012C14.9512 26.2012 15.4199 25.8105 15.5762 25.1367L16.2207 22.4121C16.6699 22.2559 17.1191 22.0801 17.5195 21.8945L19.9023 23.3691C20.4688 23.7305 21.0938 23.6719 21.5527 23.2031L23.2129 21.5527C23.6816 21.084 23.75 20.4492 23.3691 19.873L21.9043 17.5098C22.0898 17.0898 22.2656 16.6602 22.4023 16.2305L25.1465 15.5859C25.8203 15.4297 26.1914 14.9609 26.1914 14.2871L26.1914 11.9531C26.1914 11.2891 25.8203 10.8301 25.1465 10.6641L22.4219 10.0098C22.2656 9.54102 22.0801 9.11133 21.9238 8.73047L23.3887 6.32812C23.75 5.75195 23.7109 5.15625 23.2324 4.67773L21.5527 3.01758C21.0742 2.57812 20.498 2.48047 19.9316 2.8418L17.5195 4.33594C17.1289 4.14062 16.6895 3.97461 16.2207 3.81836L15.5762 1.06445C15.4199 0.390625 14.9512 0 14.2773 0L11.9141 0C11.2402 0 10.7715 0.390625 10.6152 1.06445L9.9707 3.79883C9.52148 3.95508 9.07227 4.12109 8.66211 4.32617L6.25977 2.8418C5.69336 2.48047 5.09766 2.55859 4.63867 3.01758L2.95898 4.67773C2.48047 5.15625 2.44141 5.75195 2.80273 6.32812L4.26758 8.73047C4.11133 9.11133 3.92578 9.54102 3.76953 10.0098L1.04492 10.6641C0.380859 10.8301 0 11.2891 0 11.9531L0 14.2871C0 14.9609 0.380859 15.4297 1.04492 15.5859L3.78906 16.2305C3.92578 16.6602 4.10156 17.0898 4.28711 17.5098L2.82227 19.873C2.44141 20.4492 2.50977 21.084 2.97852 21.5527L4.63867 23.2031C5.09766 23.6719 5.72266 23.7305 6.28906 23.3691L8.67188 21.8945C9.08203 22.0801 9.52148 22.2559 9.9707 22.4121L10.6152 25.1367C10.7715 25.8105 11.2402 26.2012 11.9141 26.2012ZM13.0957 17.5781C10.625 17.5781 8.61328 15.5664 8.61328 13.0957C8.61328 10.625 10.625 8.61328 13.0957 8.61328C15.5664 8.61328 17.5781 10.625 17.5781 13.0957C17.5781 15.5664 15.5664 17.5781 13.0957 17.5781Z" />
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
