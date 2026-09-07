// Shown while the very first page load's dynamic data (fresh DB data —
// see the "force-dynamic" comment on page.tsx for why this route can't
// be statically cached) streams in. A full-screen branded splash rather
// than a skeleton mimicking the eventual layout — this is what a user
// actually sees opening the app cold (a fresh tab/PWA launch/hard
// refresh), not a quick in-app navigation, so it reads better as "the
// app is starting up" than as a placeholder for content about to
// resolve into place.
export default function HomeLoading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
        <img src="/favicon-light.svg" alt="" className="h-8 w-8 dark:hidden" />
        <img src="/favicon-dark.svg" alt="" className="hidden h-8 w-8 dark:block" />
      </div>
      <p className="font-display text-lg text-foreground">Tally</p>
    </div>
  );
}
