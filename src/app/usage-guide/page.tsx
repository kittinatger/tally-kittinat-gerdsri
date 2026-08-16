import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { GearIcon } from "@/lib/icons";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import SupportScreenshot from "@/components/SupportScreenshot";
import T from "@/components/T";
import type { MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

function SignInIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M8 10h9m0 0-3-3m3 3-3 3" />
      <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function AutoImportIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="4.5" width="15" height="12" rx="2" />
      <circle cx="7.5" cy="10" r="2.5" />
      <path d="M14 7.5h.01M6 4.5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v8A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5Z" />
      <path d="M3 8.5h13.5A1.5 1.5 0 0 1 18 10v4a1.5 1.5 0 0 1-1.5 1.5" />
      <circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5.5v4.5l3 2" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M4 4h5l-2.5 5.5L4 16h5" />
      <path d="M12 4h4v4M16 4l-6 12" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" />
      <rect x="10.5" y="2.5" width="7" height="4" rx="1.5" />
      <rect x="10.5" y="8" width="7" height="9.5" rx="1.5" />
      <rect x="2.5" y="11" width="7" height="6.5" rx="1.5" />
    </svg>
  );
}

function ActivitiesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M4 6h12M4 10h12M4 14h7" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M5.5 13a4 4 0 0 1 1-7.87 5 5 0 0 1 9.5 1.4A3.5 3.5 0 0 1 15.5 13" />
      <path d="M3 3l14 14" />
    </svg>
  );
}

const SECTIONS: { id: string; title: MessageKey; icon: React.ReactNode; body: React.ReactNode }[] = [
  {
    id: "signing-in",
    title: "usageGuide.s1Title",
    icon: <SignInIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s1Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="auth.continueWithGithub" />
          </span>{" "}
          <T k="usageGuide.s1Part2" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.settings" /> &gt; <T k="settings.account" /> &gt; <T k="account.connectedAccounts" />
          </span>{" "}
          <T k="usageGuide.s1Part3" />
        </p>
        <SupportScreenshot src="signing-in.jpg" alt="Tally's sign-in screen" />
      </>
    ),
  },
  {
    id: "adding-a-transaction",
    title: "usageGuide.s2Title",
    icon: <AddIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s2Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.add" />
          </span>{" "}
          <T k="usageGuide.s2Part2" />
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-semibold text-foreground">
              <T k="usageGuide.s2Li1Label" />
            </span>{" "}
            — <T k="usageGuide.s2Li1Body" />
          </li>
          <li>
            <span className="font-semibold text-foreground">
              <T k="usageGuide.s2Li2Label" />
            </span>{" "}
            — <T k="usageGuide.s2Li2Body" />
          </li>
          <li>
            <span className="font-semibold text-foreground">
              <T k="usageGuide.s2Li3Label" />
            </span>{" "}
            — <T k="usageGuide.s2Li3Body" />
          </li>
        </ul>
        <SupportScreenshot src="add-transaction.jpg" alt="Add transaction modal, manual entry" />
      </>
    ),
  },
  {
    id: "automatic-import",
    title: "usageGuide.s3Title",
    icon: <AutoImportIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s3Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.settings" /> &gt; <T k="settings.autoImport" />
          </span>
          <T k="usageGuide.s3Part2" />{" "}
          <span className="font-semibold text-foreground">auto-import</span> <T k="usageGuide.s3Part3" />
        </p>
        <SupportScreenshot src="automatic-import.jpg" alt="Settings > Automatic import, access tokens and setup steps" />
      </>
    ),
  },
  {
    id: "wallets",
    title: "usageGuide.s4Title",
    icon: <WalletIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s4Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.settings" /> &gt; <T k="settings.wallets" />
          </span>
          <T k="usageGuide.s4Part2" />{" "}
          <span className="font-semibold text-foreground">
            <T k="usageGuide.s4Span" />
          </span>{" "}
          <T k="usageGuide.s4Part3" />
        </p>
        <SupportScreenshot src="wallets.jpg" alt="Settings > Wallets panel" />
      </>
    ),
  },
  {
    id: "budgeting",
    title: "usageGuide.s5Title",
    icon: <BudgetIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s5Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.settings" /> &gt; <T k="settings.section.budgeting" />
          </span>{" "}
          <T k="usageGuide.s5Part2" />
        </p>
        <SupportScreenshot src="budgeting.jpg" alt="Settings > Budgets panel" />
      </>
    ),
  },
  {
    id: "split-transactions",
    title: "usageGuide.s6Title",
    icon: <SplitIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s6Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="nav.add" /> &gt; <T k="usageGuide.s2Li1Label" />
          </span>
          , <T k="usageGuide.s6Part2" />
        </p>
        <SupportScreenshot
          src="add-transaction.jpg"
          alt="Manual entry form with the Split into multiple categories checkbox"
        />
      </>
    ),
  },
  {
    id: "dashboard",
    title: "usageGuide.s7Title",
    icon: <DashboardIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s7Body" />
        </p>
        <SupportScreenshot src="dashboard-editor.jpg" alt="Customize dashboard live editor" />
      </>
    ),
  },
  {
    id: "activities",
    title: "usageGuide.s8Title",
    icon: <ActivitiesIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s8Part1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="usageGuide.s8Span" />
          </span>{" "}
          <T k="usageGuide.s8Part2" />
        </p>
        <SupportScreenshot src="activities.jpg" alt="Activities with a transaction's detail pane open" />
      </>
    ),
  },
  {
    id: "settings",
    title: "usageGuide.s9Title",
    icon: <GearIcon className="h-4.5 w-4.5" />,
    body: (
      <>
        <p>
          <T k="usageGuide.s9Body" />
        </p>
        <SupportScreenshot src="account.jpg" alt="Settings > Account panel" />
      </>
    ),
  },
  {
    id: "offline",
    title: "usageGuide.s10Title",
    icon: <OfflineIcon />,
    body: (
      <>
        <p>
          <T k="usageGuide.s10Body" />
        </p>
        <SupportScreenshot src="offline.jpg" alt="Tally's offline page" />
      </>
    ),
  },
];

export default async function UsageGuidePage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title={<T k="usageGuide.title" />}>
        <p className="-mt-3 mb-5 text-sm text-ink-soft">
          <T k="usageGuide.subtitle" />
        </p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-navy hover:text-foreground"
            >
              <T k={s.title} />
            </a>
          ))}
        </div>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section id={s.id} key={s.id} className="scroll-mt-4 rounded-card border border-line bg-surface p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
                  {s.icon}
                </span>
                <h3 className="font-display text-lg text-foreground">
                  <T k={s.title} />
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-ink-soft">{s.body}</div>
            </section>
          ))}
        </div>
    </SettingsSubpageLayout>
  );
}
