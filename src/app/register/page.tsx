import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";

const STEPS = [
  { label: "Create your account", active: true },
  { label: "Set up a wallet" },
  { label: "Log your first expense" },
];

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen bg-background px-4 pb-10 pt-14 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu />
      </div>

      {/* Mobile: gradient hero with step pills and an overlapping form card */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy-dark to-navy-darker px-6 pb-16 pt-8 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <img src="/favicon-dark.svg" alt="" className="relative h-10 w-10" />
          <h1 className="relative mt-4 font-display text-3xl leading-tight">Get started</h1>
          <p className="relative mt-1.5 text-sm text-white/80">Start tracking your money in minutes</p>

          <div className="relative mt-5 flex gap-2">
            {STEPS.map((step, i) => (
              <div
                key={step.label}
                className={`flex flex-1 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                  step.active ? "bg-white text-navy-darker" : "bg-white/10 text-white/70"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.active ? "bg-navy text-white" : "bg-white/15 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="-mt-9 px-1">
          <div className="rounded-card border border-line bg-surface p-6 shadow-soft">
            <RegisterForm />
          </div>
        </div>
      </div>

      {/* Desktop: branded split panel */}
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:flex lg:w-full lg:max-w-3xl">
        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:bg-gradient-to-br lg:from-navy lg:via-navy-dark lg:to-navy-darker lg:p-10">
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

        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-10">
          <h1 className="mb-6 font-display text-2xl text-foreground">Sign up</h1>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
