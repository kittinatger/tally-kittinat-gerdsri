import Link from "next/link";
import SettingsMenu from "@/components/SettingsMenu";
import T from "@/components/T";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden px-6 pb-10 pt-16"
      style={{
        backgroundImage: "linear-gradient(180deg, var(--navy) 0%, var(--navy) 30%, var(--background) 68%)",
      }}
    >
      <div className="absolute right-4 top-4 z-10 [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
        <SettingsMenu />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
        <div className="h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="relative flex flex-[1.3] flex-col items-center justify-center gap-3 text-center">
        <img src="/favicon-dark.svg" alt="" className="h-28 w-28" />
        <h1 className="font-display text-3xl text-white">Tally</h1>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-end gap-6 pb-2">
        <p className="text-center text-sm text-ink-soft">
          <T k="auth.welcomeTagline" />
        </p>
        <div className="w-full max-w-sm space-y-3">
          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-full bg-navy px-4 py-3 font-semibold text-white shadow-soft transition hover:bg-navy-dark"
          >
            <T k="auth.signIn" />
          </Link>
          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-full border border-navy px-4 py-3 font-semibold text-navy transition hover:bg-navy/10"
          >
            <T k="auth.createAccount" />
          </Link>
        </div>
      </div>
    </main>
  );
}
