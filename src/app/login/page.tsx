import LoginForm from "@/components/LoginForm";
import SettingsMenu from "@/components/SettingsMenu";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <SettingsMenu />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/favicon-light.svg" alt="Tally" className="h-14 w-14 dark:hidden" />
        <img src="/favicon-dark.svg" alt="Tally" className="hidden h-14 w-14 dark:block" />
        <h1 className="font-display text-2xl text-foreground">Tally</h1>
        <p className="text-sm text-ink-soft">Sign in to view your expenses</p>
      </div>
      <LoginForm next={next ?? "/"} oauthError={error} />
    </main>
  );
}
