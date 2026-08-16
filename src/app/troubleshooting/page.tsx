import Link from "next/link";
import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import T from "@/components/T";
import type { MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

type Entry = { error: MessageKey; what: MessageKey; why: MessageKey; fix: MessageKey };
type Group = { heading: MessageKey; entries: Entry[] };

const GROUPS: Group[] = [
  {
    heading: "troubleshooting.g1Heading",
    entries: [
      { error: "troubleshooting.g1e1Error", what: "troubleshooting.g1e1What", why: "troubleshooting.g1e1Why", fix: "troubleshooting.g1e1Fix" },
      { error: "troubleshooting.g1e2Error", what: "troubleshooting.g1e2What", why: "troubleshooting.g1e2Why", fix: "troubleshooting.g1e2Fix" },
      { error: "troubleshooting.g1e3Error", what: "troubleshooting.g1e3What", why: "troubleshooting.g1e3Why", fix: "troubleshooting.g1e3Fix" },
      { error: "troubleshooting.g1e4Error", what: "troubleshooting.g1e4What", why: "troubleshooting.g1e4Why", fix: "troubleshooting.g1e4Fix" },
      { error: "troubleshooting.g1e5Error", what: "troubleshooting.g1e5What", why: "troubleshooting.g1e5Why", fix: "troubleshooting.g1e5Fix" },
      { error: "troubleshooting.g1e6Error", what: "troubleshooting.g1e6What", why: "troubleshooting.g1e6Why", fix: "troubleshooting.g1e6Fix" },
    ],
  },
  {
    heading: "troubleshooting.g2Heading",
    entries: [
      { error: "troubleshooting.g2e1Error", what: "troubleshooting.g2e1What", why: "troubleshooting.g2e1Why", fix: "troubleshooting.g2e1Fix" },
      { error: "troubleshooting.g2e2Error", what: "troubleshooting.g2e2What", why: "troubleshooting.g2e2Why", fix: "troubleshooting.g2e2Fix" },
      { error: "troubleshooting.g2e3Error", what: "troubleshooting.g2e3What", why: "troubleshooting.g2e3Why", fix: "troubleshooting.g2e3Fix" },
      { error: "troubleshooting.g2e4Error", what: "troubleshooting.g2e4What", why: "troubleshooting.g2e4Why", fix: "troubleshooting.g2e4Fix" },
      { error: "troubleshooting.g2e5Error", what: "troubleshooting.g2e5What", why: "troubleshooting.g2e5Why", fix: "troubleshooting.g2e5Fix" },
      { error: "troubleshooting.g2e6Error", what: "troubleshooting.g2e6What", why: "troubleshooting.g2e6Why", fix: "troubleshooting.g2e6Fix" },
    ],
  },
  {
    heading: "troubleshooting.g3Heading",
    entries: [
      { error: "troubleshooting.g3e1Error", what: "troubleshooting.g3e1What", why: "troubleshooting.g3e1Why", fix: "troubleshooting.g3e1Fix" },
      { error: "troubleshooting.g3e2Error", what: "troubleshooting.g3e2What", why: "troubleshooting.g3e2Why", fix: "troubleshooting.g3e2Fix" },
    ],
  },
  {
    heading: "troubleshooting.g4Heading",
    entries: [
      { error: "troubleshooting.g4e1Error", what: "troubleshooting.g4e1What", why: "troubleshooting.g4e1Why", fix: "troubleshooting.g4e1Fix" },
      { error: "troubleshooting.g4e2Error", what: "troubleshooting.g4e2What", why: "troubleshooting.g4e2Why", fix: "troubleshooting.g4e2Fix" },
      { error: "troubleshooting.g4e3Error", what: "troubleshooting.g4e3What", why: "troubleshooting.g4e3Why", fix: "troubleshooting.g4e3Fix" },
      { error: "troubleshooting.g4e4Error", what: "troubleshooting.g4e4What", why: "troubleshooting.g4e4Why", fix: "troubleshooting.g4e4Fix" },
    ],
  },
  {
    heading: "troubleshooting.g5Heading",
    entries: [
      { error: "troubleshooting.g5e1Error", what: "troubleshooting.g5e1What", why: "troubleshooting.g5e1Why", fix: "troubleshooting.g5e1Fix" },
      { error: "troubleshooting.g5e2Error", what: "troubleshooting.g5e2What", why: "troubleshooting.g5e2Why", fix: "troubleshooting.g5e2Fix" },
      { error: "troubleshooting.g5e3Error", what: "troubleshooting.g5e3What", why: "troubleshooting.g5e3Why", fix: "troubleshooting.g5e3Fix" },
      { error: "troubleshooting.g5e4Error", what: "troubleshooting.g5e4What", why: "troubleshooting.g5e4Why", fix: "troubleshooting.g5e4Fix" },
    ],
  },
];

export default async function TroubleshootingPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="troubleshooting.title" />}>
        <p className="-mt-3 mb-5 text-sm text-ink-soft">
          <T k="troubleshooting.introBefore" />{" "}
          <Link href="/settings" className="text-navy underline hover:no-underline dark:text-blue-300">
            <T k="nav.settings" /> &gt; <T k="settings.errorLog" />
          </Link>{" "}
          <T k="troubleshooting.introAfter" />
        </p>

        <div className="space-y-6">
          {GROUPS.map((group) => (
            <section key={group.heading} className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-3 font-display text-lg text-foreground">
                <T k={group.heading} />
              </h3>
              <div className="space-y-4">
                {group.entries.map((entry) => (
                  <div key={entry.error} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <p className="font-mono text-xs font-semibold text-foreground">
                      &ldquo;<T k={entry.error} />&rdquo;
                    </p>
                    <dl className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-soft">
                      <div>
                        <dt className="inline font-semibold text-ink-soft">
                          <T k="troubleshooting.whatHappenedLabel" />{" "}
                        </dt>
                        <dd className="inline">
                          <T k={entry.what} />
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink-soft">
                          <T k="troubleshooting.whyLabel" />{" "}
                        </dt>
                        <dd className="inline">
                          <T k={entry.why} />
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink-soft">
                          <T k="troubleshooting.fixLabel" />{" "}
                        </dt>
                        <dd className="inline">
                          <T k={entry.fix} />
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
    </SettingsSubpageLayout>
  );
}
