import Link from "next/link";
import SettingsMenu from "@/components/SettingsMenu";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background px-6 pb-10 pt-16">
      {/* Green hero with a wavy (rather than straight) bottom edge — the
          fill is itself a top-to-bottom gradient, fading to transparent
          near the curve, rather than a flat color with a hard cutoff. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56vh] min-h-[380px]">
        <svg viewBox="0 0 1000 560" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="waveFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--navy)" />
              <stop offset="55%" stopColor="var(--navy)" />
              <stop offset="100%" stopColor="var(--navy)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 H1000 V260 C900,340 840,300 760,330 C660,368 620,460 520,470 C420,480 380,400 300,360 C210,316 160,360 60,320 L0,290 Z"
            fill="url(#waveFade)"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-0 flex justify-center">
        <div className="h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4 z-10 [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
        <SettingsMenu />
      </div>

      <div className="relative z-10 flex flex-[1.3] flex-col items-center justify-center gap-3 text-center">
        <img src="/favicon-dark.svg" alt="" className="h-28 w-28" />
        <h1 className="font-display text-3xl text-white">Tally</h1>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-6 pb-2">
        <p className="text-center text-sm text-ink-soft">
          A private, personal expense tracker — add expenses manually or snap a photo of a receipt and let it read
          the details for you.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-full bg-navy px-4 py-3 font-semibold text-white shadow-soft transition hover:bg-navy-dark"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-full border border-navy px-4 py-3 font-semibold text-navy transition hover:bg-navy/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
