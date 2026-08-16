import Link from "next/link";
import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="settings.contact" />}>
        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="contact.emailHeading" />
            </h3>
            <p>
              <T k="contact.emailBefore" />{" "}
              <a href="mailto:kittinatg@gmail.com" className="text-navy underline hover:no-underline dark:text-blue-300">
                kittinatg@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="contact.developerHeading" />
            </h3>
            <p>
              <T k="contact.developerBefore" />{" "}
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
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="contact.securityHeading" />
            </h3>
            <p>
              <T k="contact.securityBefore" />{" "}
              <a href="mailto:kittinatg@gmail.com" className="text-navy underline hover:no-underline dark:text-blue-300">
                kittinatg@gmail.com
              </a>{" "}
              <T k="contact.securityMiddle" />{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/.github/SECURITY.md"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                <T k="contact.securityPolicyLinkText" />
              </a>{" "}
              <T k="contact.securityAfter" />
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">
              <T k="contact.bugsHeading" />
            </h3>
            <p>
              <T k="contact.bugsBefore" />{" "}
              <Link href="/report-issue" className="text-navy underline hover:no-underline dark:text-blue-300">
                <T k="settings.reportIssue" />
              </Link>
              .
            </p>
          </section>
        </div>
    </SettingsSubpageLayout>
  );
}
