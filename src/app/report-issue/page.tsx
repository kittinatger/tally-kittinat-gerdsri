import Link from "next/link";
import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";

export const dynamic = "force-dynamic";

export default async function ReportIssuePage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title="Report an Issue">
        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Reporting a specific error?</h3>
            <p>
              If Tally showed you an error message, check{" "}
              <Link href="/settings" className="text-navy underline hover:no-underline dark:text-blue-300">
                Settings
              </Link>{" "}
              &gt; Error log first — it keeps a local record of recent errors and can open a pre-filled GitHub issue
              for the specific one you hit, with the details already in place.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Bugs &amp; feature requests</h3>
            <p>
              Open a{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/issues/new"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                new GitHub issue
              </a>{" "}
              describing what happened (or what you&apos;d like to see), what you expected, steps to reproduce, and
              your environment (OS, browser, deployment method).
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Security vulnerabilities</h3>
            <p>
              <span className="font-semibold text-foreground">Please do not</span> open a public GitHub issue for
              security vulnerabilities. Instead, email{" "}
              <a href="mailto:kittinatg@gmail.com" className="text-navy underline hover:no-underline dark:text-blue-300">
                kittinatg@gmail.com
              </a>{" "}
              with a description, affected versions, steps to reproduce, and potential impact. Don&apos;t include
              working exploit code, and don&apos;t test vulnerabilities on instances you don&apos;t own. See the full{" "}
              <a
                href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/.github/SECURITY.md"
                target="_blank"
                rel="noreferrer"
                className="text-navy underline hover:no-underline dark:text-blue-300"
              >
                Security Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Response timeline</h3>
            <p>Reports are acknowledged within 2 business days; critical fixes are targeted within 2 weeks.</p>
          </section>
        </div>
    </SettingsSubpageLayout>
  );
}
