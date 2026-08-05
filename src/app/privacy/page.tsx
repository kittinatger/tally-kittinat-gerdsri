import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <h2 className="mb-5 font-display text-2xl text-foreground">Privacy Policy</h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">What&apos;s stored</h3>
            <p>
              Tally stores the expenses and income you log (date, amount, merchant, category, notes, tags), any
              receipt images you attach, your wallets, recurring rules, budgets, and savings goals, your category
              customizations, your currency and display preferences, and your account credentials (your password is
              stored as a salted hash, never in plain text). If you add an email for password reset or notifications,
              it&apos;s stored alongside your account. If you create a personal access token for automatic receipt
              import, only its hash is stored — the raw token is shown to you once and can&apos;t be recovered.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Your data is private to your account</h3>
            <p>
              Tally supports multiple accounts on a single deployment. Every account&apos;s expenses, categories, and
              settings are isolated — no other account on the same deployment can see or modify your data.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Third parties</h3>
            <p>
              When you scan a receipt or record a voice memo, the image or audio is sent to{" "}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Google Gemini
              </a>{" "}
              to extract the transaction details. If automatic currency conversion is enabled, detected amounts are
              converted using exchange rates from{" "}
              <a
                href="https://frankfurter.app"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Frankfurter
              </a>
              , a free ECB-rate API. If you set an email on your account, password reset links and any opted-in
              recurring/budget notification emails are sent via{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Resend
              </a>
              . No other third parties receive your data.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Self-hosted</h3>
            <p>
              Tally is open-source, self-hosted software. Whoever deploys a given instance controls the actual
              database and infrastructure it runs on — this policy describes how the application itself handles
              data, not any particular deployment&apos;s operational practices.
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/settings" className="text-navy hover:underline dark:text-blue-300">
            Back to Settings
          </Link>
        </p>
      </main>
    </div>
  );
}
