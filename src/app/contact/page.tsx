import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-5 font-display text-2xl text-foreground">Contact</h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Email</h3>
            <p>
              For general questions, feedback, or account issues, email{" "}
              <a href="mailto:kittinatg@gmail.com" className="text-navy underline hover:no-underline dark:text-blue-300">
                kittinatg@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Developer</h3>
            <p>
              Tally is developed by{" "}
              <a
                href="https://kittinatger.github.io/kittinat-gerdsri/"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Kittinat Gerdsri
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Security vulnerabilities</h3>
            <p>
              Please don&apos;t open a public GitHub issue for security reports — email{" "}
              <a href="mailto:kittinatg@gmail.com" className="text-navy underline hover:no-underline dark:text-blue-300">
                kittinatg@gmail.com
              </a>{" "}
              directly instead. See the{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/.github/SECURITY.md"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Security Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Bugs &amp; feature requests</h3>
            <p>
              See{" "}
              <Link href="/report-issue" className="text-navy underline hover:no-underline dark:text-blue-300">
                Report an issue
              </Link>
              .
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
