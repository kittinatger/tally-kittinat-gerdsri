import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";

const STEPS = [
  { label: "Create your account", active: true },
  { label: "Set up a wallet" },
  { label: "Log your first expense" },
];

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen bg-background px-4 pb-10 pt-16 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu />
      </div>

      {/* Mobile: back-arrow header */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/login"
            aria-label="Back to sign in"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-[var(--nav-hover-bg)]"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1 .02 1.06L9.832 10l2.978 3.71a.75.75 0 1 1-1.06 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="font-display text-2xl text-foreground">Create account</h1>
        </div>
        <RegisterForm />
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
