import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";
import T from "@/components/T";

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-5 font-display text-2xl text-foreground">
          <T k="terms.title" />
        </h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="terms.licenseHeading" />
            </h3>
            <p>
              <T k="terms.licenseBefore" />{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                LICENSE
              </a>{" "}
              <T k="terms.licenseAfter" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="terms.asIsHeading" />
            </h3>
            <p>
              <T k="terms.asIsBody" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="terms.selfHostHeading" />
            </h3>
            <p>
              <T k="terms.selfHostBody" />
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
