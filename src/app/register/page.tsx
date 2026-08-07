import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";

const STEPS = [
  { label: "Create your account", active: true },
  { label: "Set up a wallet" },
  { label: "Log your first expense" },
];

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <SettingsMenu />
      </div>

      <div className="w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:flex lg:max-w-3xl">
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:bg-gradient-to-br lg:from-navy lg:via-navy-dark lg:to-navy-darker lg:p-10">
          <div className="flex flex-col gap-4">
            <img src="/favicon-dark.svg" alt="" className="h-10 w-10" />
            <h2 className="font-display text-3xl leading-tight text-white">Get started with Tally</h2>
            <p className="text-sm text-white/80">Complete these easy steps to start tracking your money.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-card p-3 ${
                  step.active ? "bg-white text-navy-darker" : "bg-white/10 text-white/70"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.active ? "bg-navy text-white" : "bg-white/15 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:flex lg:w-1/2 lg:flex-col lg:justify-center">
          <div className="mb-6 flex flex-col items-center gap-2.5 lg:hidden">
            <img src="/favicon-light.svg" alt="Tally" className="h-12 w-12 dark:hidden" />
            <img src="/favicon-dark.svg" alt="Tally" className="hidden h-12 w-12 dark:block" />
            <h1 className="font-display text-2xl text-foreground">Create your account</h1>
            <p className="text-sm text-ink-soft">Start tracking your money in minutes</p>
          </div>
          <h1 className="mb-6 hidden font-display text-2xl text-foreground lg:block">Sign up</h1>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
