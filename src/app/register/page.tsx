import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <SettingsMenu />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-2xl font-bold text-white shadow-soft">
          T
        </div>
        <h1 className="font-display text-2xl text-foreground">Tally</h1>
        <p className="text-sm text-ink-soft">Create your account</p>
      </div>
      <RegisterForm />
    </main>
  );
}
