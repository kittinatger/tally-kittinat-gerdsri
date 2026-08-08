import LoginForm from "@/components/LoginForm";
import SettingsMenu from "@/components/SettingsMenu";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="relative min-h-screen bg-background px-4 pb-10 pt-16 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu />
      </div>

      {/* Mobile: plain, icon-badge header */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-navy/10">
          <img src="/favicon-light.svg" alt="Tally" className="h-6 w-6 dark:hidden" />
          <img src="/favicon-dark.svg" alt="Tally" className="hidden h-6 w-6 dark:block" />
        </div>
        <LoginForm next={next ?? "/"} oauthError={error} />
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
