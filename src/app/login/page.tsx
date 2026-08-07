import LoginForm from "@/components/LoginForm";
import SettingsMenu from "@/components/SettingsMenu";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <SettingsMenu />
      </div>

      <div className="w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:flex lg:max-w-3xl">
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:gap-4 lg:bg-gradient-to-br lg:from-navy lg:via-navy-dark lg:to-navy-darker lg:p-10">
          <img src="/favicon-dark.svg" alt="" className="h-10 w-10" />
          <h2 className="font-display text-3xl leading-tight text-white">Welcome back to Tally</h2>
          <p className="text-sm text-white/80">
            Sign in to pick up right where you left off — your wallets, budgets, and activity are all waiting.
          </p>
        </div>

        <div className="p-6 sm:p-8 lg:flex lg:w-1/2 lg:flex-col lg:justify-center">
          <div className="mb-6 flex flex-col items-center gap-2.5 lg:hidden">
            <img src="/favicon-light.svg" alt="Tally" className="h-12 w-12 dark:hidden" />
            <img src="/favicon-dark.svg" alt="Tally" className="hidden h-12 w-12 dark:block" />
            <h1 className="font-display text-2xl text-foreground">Welcome back</h1>
            <p className="text-sm text-ink-soft">Sign in to view your expenses</p>
          </div>
          <h1 className="mb-6 hidden font-display text-2xl text-foreground lg:block">Sign in</h1>
          <LoginForm next={next ?? "/"} oauthError={error} />
        </div>
      </div>
    </main>
  );
}
