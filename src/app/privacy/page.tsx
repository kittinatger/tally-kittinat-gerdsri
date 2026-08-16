import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";
import T from "@/components/T";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-5 font-display text-2xl text-foreground">
          <T k="privacy.title" />
        </h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="privacy.storedHeading" />
            </h3>
            <p>
              <T k="privacy.storedBody" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="privacy.isolationHeading" />
            </h3>
            <p>
              <T k="privacy.isolationBody" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="privacy.thirdPartiesHeading" />
            </h3>
            <p>
              <T k="privacy.thirdPartiesBefore" />{" "}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Google Gemini
              </a>{" "}
              <T k="privacy.thirdPartiesMiddle1" />{" "}
              <a
                href="https://frankfurter.app"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Frankfurter
              </a>
              <T k="privacy.thirdPartiesMiddle2" />{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Resend
              </a>
              <T k="privacy.thirdPartiesAfter" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="privacy.selfHostedHeading" />
            </h3>
            <p>
              <T k="privacy.selfHostedBody" />
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
