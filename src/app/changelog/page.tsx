import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import { RELEASES } from "@/lib/changelog-data";

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title="Changelog">
        <p className="-mt-3 mb-5 text-sm text-ink-soft">
          Full history on{" "}
          <a
            href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/CHANGELOG.md"
            target="_blank"
            rel="noreferrer"
            className="text-navy underline hover:no-underline dark:text-blue-300"
          >
            GitHub
          </a>
          .
        </p>

        <div className="space-y-6">
          {RELEASES.map((release) => (
            <div key={release.version} className="rounded-card border border-line bg-surface p-5">
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="font-display text-lg text-foreground">v{release.version}</h3>
                <span className="text-xs text-ink-soft">{release.date}</span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
                {release.sections.map((section) => (
                  <div key={section.heading}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {section.heading}
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    </SettingsSubpageLayout>
  );
}
