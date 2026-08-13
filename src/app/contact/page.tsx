import Link from "next/link";
import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title="Contact">
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
    </SettingsSubpageLayout>
  );
}
