// Public, unauthenticated — meant to be dropped into an <iframe> on a
// third-party page/blog (see the "Embed" section of the Refer a friend
// settings page). No session, no per-user referral tracking: just a
// compact, self-contained card pointing at sign-up. Excluded from the
// auth gate in src/proxy.ts the same way the public split-share page is.
export const dynamic = "force-dynamic";

export default function EmbedReferPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-3">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-card border border-line bg-surface p-5 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-accent text-xl font-bold text-white">T</span>
        <div>
          <p className="font-display text-lg text-foreground">Tally</p>
          <p className="mt-1 text-sm text-ink-soft">Track your spending with Tally — join me!</p>
        </div>
        <a
          href="/register"
          target="_top"
          className="w-full rounded-full bg-surface-accent px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          Join Tally
        </a>
      </div>
    </div>
  );
}
