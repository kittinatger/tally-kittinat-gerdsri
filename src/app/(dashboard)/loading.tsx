import { BottomNav } from "@/components/AppHeader";

// Shown instantly on navigation while the dynamic page (fresh DB data) streams
// in behind it — see the "force-dynamic" comment on page.tsx for why this
// route can't be statically cached. Mirrors AppHeader's markup (including
// which parts are hidden on mobile) so the nav doesn't flicker/disappear
// during the transition.
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <header className="sticky top-3 z-10 hidden items-center justify-between gap-2 rounded-full border border-[var(--glass-border)] bg-[image:var(--glass-bg)] px-3 py-2 shadow-soft backdrop-blur-xl sm:flex sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/favicon-light.svg" alt="Tally" className="h-8 w-8 shrink-0 dark:hidden" />
          <img src="/favicon-dark.svg" alt="Tally" className="hidden h-8 w-8 shrink-0 dark:block" />
          <h1 className="hidden font-display text-lg text-foreground min-[420px]:block">Tally</h1>
        </div>
        <nav className="flex items-center gap-1 rounded-full bg-bg-soft p-1">
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm sm:px-3.5 sm:py-1.5 sm:text-sm">
            Dashboard
          </span>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft sm:px-3.5 sm:py-1.5 sm:text-sm">
            Activities
          </span>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft sm:px-3.5 sm:py-1.5 sm:text-sm">
            Settings
          </span>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 px-2.5 py-2 sm:px-3.5">
          <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-ink-soft/30" />
        </div>
      </header>

      <BottomNav pathname="/" onAddClick={() => {}} />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="h-[74px] animate-pulse rounded-card border border-surface-line bg-surface" />
          <div className="h-[74px] animate-pulse rounded-card border border-surface-line bg-surface" />
          <div className="h-[74px] animate-pulse rounded-card border border-surface-line bg-surface" />
        </div>
        <div className="mt-8 h-64 animate-pulse rounded-card border border-line bg-surface" />
      </main>
    </div>
  );
}
