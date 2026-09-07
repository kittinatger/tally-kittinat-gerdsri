// Shown while the very first page load's dynamic data (fresh DB data —
// see the "force-dynamic" comment on page.tsx for why this route can't
// be statically cached) streams in. A full-screen branded splash rather
// than a skeleton mimicking the eventual layout — this is what a user
// actually sees opening the app cold (a fresh tab/PWA launch/hard
// refresh), not a quick in-app navigation, so it reads better as "the
// app is starting up" than as a placeholder for content about to
// resolve into place.
//
// Deliberately no <img>/favicon here (unlike AppHeader's real header,
// which can afford to wait) — the actual favicon-*.svg files are a
// full illustration (megabytes of path data), not a simple icon, so
// loading them delayed this screen's own first paint past the point
// the real page had already finished loading behind it, defeating the
// entire point of an instant splash. Pure CSS/text only.
export default function HomeLoading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-4">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
      <p className="font-display text-lg text-foreground">Tally</p>
    </div>
  );
}
