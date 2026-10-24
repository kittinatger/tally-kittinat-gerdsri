import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { GearIcon, MembershipCardIcon } from "@/lib/icons";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import SupportScreenshot from "@/components/SupportScreenshot";
import T from "@/components/T";
import type { MessageKey } from "@/lib/i18n/messages";
import { ArrowsSplitIcon as PhArrowsSplitIcon, ChartPieSliceIcon as PhChartPieSliceIcon, ImagesIcon as PhImagesIcon, ListBulletsIcon as PhListBulletsIcon, PlusCircleIcon as PhPlusCircleIcon, SignInIcon as PhSignInIcon, SquaresFourIcon as PhSquaresFourIcon, WalletIcon as PhWalletIcon, WifiSlashIcon as PhWifiSlashIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

function SignInIcon() {
  return <PhSignInIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function AddIcon() {
  return <PhPlusCircleIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function AutoImportIcon() {
  return <PhImagesIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function WalletIcon() {
  return <PhWalletIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function BudgetIcon() {
  return <PhChartPieSliceIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function SplitIcon() {
  return <PhArrowsSplitIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function DashboardIcon() {
  return <PhSquaresFourIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function ActivitiesIcon() {
  return <PhListBulletsIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function OfflineIcon() {
  return <PhWifiSlashIcon weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
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
    id: "wallet-passes",
    title: "usageGuide.sPassesTitle",
    icon: <MembershipCardIcon className="h-4.5 w-4.5" />,
    body: (
      <>
        <p>
          <T k="usageGuide.sPassesPart1" />{" "}
          <span className="font-semibold text-foreground">
            <T k="usageGuide.sPassesSpan" />
          </span>
          <T k="usageGuide.sPassesPart2" />
        </p>
        {/* No screenshot yet — add wallet-passes-desktop.jpg / wallet-passes-mobile.jpg
         * to public/screenshots and screenshots/, then restore this line:
         * <SupportScreenshot src="wallet-passes-desktop.jpg" mobileSrc="wallet-passes-mobile.jpg" alt="Wallet page with a loyalty pass, and its editor" /> */}
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
            <T k="nav.settings" /> &gt; <T k="settings.section.records" />
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
