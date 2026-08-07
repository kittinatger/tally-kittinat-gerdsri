import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <SettingsMenu />
      </div>
      <div className="mb-7 flex flex-col items-center gap-2.5">
        <img src="/favicon-light.svg" alt="Tally" className="h-12 w-12 dark:hidden" />
        <img src="/favicon-dark.svg" alt="Tally" className="hidden h-12 w-12 dark:block" />
        <h1 className="font-display text-2xl text-foreground">Create your account</h1>
        <p className="text-sm text-ink-soft">Start tracking your money in minutes</p>
      </div>
      <RegisterForm />
    </main>
  );
}
