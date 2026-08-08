import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-5 font-display text-2xl text-foreground">Terms of Service</h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Open source, MIT licensed</h3>
            <p>
              Tally is free, open-source software released under the MIT License. You&apos;re free to use, copy, modify,
              and deploy it, subject to the terms of that license. See the{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                LICENSE
              </a>{" "}
              file for the full text.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Provided as-is</h3>
            <p>
              Tally is provided &quot;as is&quot;, without warranty of any kind. The software is offered for personal
              expense tracking; you&apos;re responsible for keeping your own backups and for the accuracy of the data
              you enter.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Self-hosted responsibility</h3>
            <p>
              Whoever deploys a given Tally instance is responsible for that deployment — its security, its
              database, who they give access to, and how they handle the data stored there.
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
