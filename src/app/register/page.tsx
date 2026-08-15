import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import SettingsMenu from "@/components/SettingsMenu";
import T from "@/components/T";
import { ChevronLeftIcon } from "@/lib/icons";
import type { MessageKey } from "@/lib/i18n/messages";

const STEPS: { key: MessageKey; active?: boolean }[] = [
  { key: "auth.stepCreateAccount", active: true },
  { key: "auth.stepSetupWallet" },
  { key: "auth.stepLogExpense" },
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
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-2xl text-foreground">
            <T k="auth.createAccount" />
          </h1>
        </div>
        <RegisterForm />
      </div>

      {/* Desktop: branded split panel */}
      <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:flex lg:w-full lg:max-w-3xl">
        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:bg-gradient-to-br lg:from-navy lg:via-navy-dark lg:to-navy-darker lg:p-10">
          <div className="flex flex-col gap-4">
            <img src="/favicon-dark.svg" alt="" className="h-10 w-10" />
            <h2 className="font-display text-3xl leading-tight text-white">
              <T k="auth.getStarted" />
            </h2>
            <p className="text-sm text-white/80">
              <T k="auth.completeSteps" />
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <div
                key={step.key}
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
                <span className="text-sm font-semibold">
                  <T k={step.key} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-10">
          <h1 className="mb-6 font-display text-2xl text-foreground">
            <T k="auth.signUp" />
          </h1>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
