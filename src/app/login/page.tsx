import LoginForm from "@/components/LoginForm";
import SettingsMenu from "@/components/SettingsMenu";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="relative min-h-screen bg-background px-4 pb-10 pt-14 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu />
      </div>

      {/* Mobile: gradient hero with an overlapping form card */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy-dark to-navy-darker px-6 pb-16 pt-8 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <img src="/favicon-dark.svg" alt="" className="relative h-10 w-10" />
          <h1 className="relative mt-4 font-display text-3xl leading-tight">Welcome back</h1>
          <p className="relative mt-1.5 text-sm text-white/80">Sign in to view your expenses</p>
        </div>

        <div className="-mt-9 px-1">
          <div className="rounded-card border border-line bg-surface p-6 shadow-soft">
            <LoginForm next={next ?? "/"} oauthError={error} />
          </div>
        </div>
      </div>

      {/* Desktop: branded split panel */}
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:flex lg:w-full lg:max-w-3xl">
        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:gap-4 lg:bg-gradient-to-br lg:from-navy lg:via-navy-dark lg:to-navy-darker lg:p-10">
          <img src="/favicon-dark.svg" alt="" className="h-10 w-10" />
          <h2 className="font-display text-3xl leading-tight text-white">Welcome back to Tally</h2>
          <p className="text-sm text-white/80">
            Sign in to pick up right where you left off — your wallets, budgets, and activity are all waiting.
          </p>
        </div>

        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-10">
          <h1 className="mb-6 font-display text-2xl text-foreground">Sign in</h1>
          <LoginForm next={next ?? "/"} oauthError={error} />
        </div>
      </div>
    </main>
  );
}
