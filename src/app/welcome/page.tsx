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
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-navy via-navy-dark to-navy-darker px-6 pb-10 pt-16 text-white">
      <div className="absolute right-4 top-4 z-10 [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
        <SettingsMenu />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="mt-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <img src="/favicon-dark.svg" alt="" className="h-16 w-16" />
        <h1 className="font-display text-3xl text-white">Tally</h1>
      </div>

      <div className="relative w-full max-w-sm">
        <p className="mb-6 text-center text-sm text-white/80">
          A private, personal expense tracker — add expenses manually or snap a photo of a receipt and let it read
          the details for you.
        </p>
        <div className="space-y-3">
          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-full bg-white px-4 py-3 font-semibold text-navy-darker shadow-soft transition hover:bg-white/90"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-full border border-white/40 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
