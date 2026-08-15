import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { GearIcon } from "@/lib/icons";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import SupportScreenshot from "@/components/SupportScreenshot";

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

const SECTIONS: { id: string; title: string; icon: React.ReactNode; body: React.ReactNode }[] = [
  {
    id: "signing-in",
    title: "Signing in",
    icon: <SignInIcon />,
    body: (
      <>
        <p>
          Sign up with a username and password, or use{" "}
          <span className="font-semibold text-foreground">Continue with GitHub</span> on the sign-in/sign-up screen.
          Already have a username/password account? Link GitHub to it (or unlink it later) from{" "}
          <span className="font-semibold text-foreground">Settings &gt; Account &gt; Connected accounts</span> —
          unlinking is blocked if the account has no password set, so you&apos;re never left with no way back in.
        </p>
        <SupportScreenshot src="signing-in.jpg" alt="Tally's sign-in screen" />
      </>
    ),
  },
  {
    id: "adding-a-transaction",
    title: "Adding a transaction",
    icon: <AddIcon />,
    body: (
      <>
        <p>
          Tap <span className="font-semibold text-foreground">Add</span> from the Dashboard or Activities page — or
          tap the Income/Expenses card on the Dashboard to jump straight to Add with that type pre-selected. You have
          three ways to log a transaction:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-semibold text-foreground">Manual entry</span> — fill in date, amount, merchant,
            category, tags, and notes yourself.
          </li>
          <li>
            <span className="font-semibold text-foreground">Scan a document</span> — take a photo or upload an image
            of a receipt, payslip, or invoice; Gemini reads the details and pre-fills the form for you to review
            before saving. Select multiple images to batch-scan them one after another.
          </li>
          <li>
            <span className="font-semibold text-foreground">Speak</span> — tap the mic and describe the transaction
            out loud (e.g. &quot;spent 12 dollars on coffee at Starbucks today&quot;); it&apos;s transcribed and
            extracted the same way.
          </li>
        </ul>
        <SupportScreenshot src="add-transaction.jpg" alt="Add transaction modal, manual entry" />
      </>
    ),
  },
  {
    id: "automatic-import",
    title: "Automatic receipt import",
    icon: <AutoImportIcon />,
    body: (
      <>
        <p>
          For receipts you&apos;d rather not scan by hand one at a time: create a personal access token in{" "}
          <span className="font-semibold text-foreground">Settings &gt; Automatic import</span>, then set up an iOS
          Shortcut (fully automatic when a photo lands in a chosen album, or a one-tap Share Sheet variant) or the
          Android share sheet, following the setup steps shown there. Imported transactions are tagged{" "}
          <span className="font-semibold text-foreground">auto-import</span> and keep the original photo attached, so
          you can filter by that tag in Activities to spot-check anything misread.
        </p>
        <SupportScreenshot src="automatic-import.jpg" alt="Settings > Automatic import, access tokens and setup steps" />
      </>
    ),
  },
  {
    id: "wallets",
    title: "Wallets",
    icon: <WalletIcon />,
    body: (
      <>
        <p>
          Track balances across multiple cash/bank/e-wallet pools from{" "}
          <span className="font-semibold text-foreground">Settings &gt; Wallets</span>. Transfer money between your
          own wallets (doesn&apos;t count as income or spending), set a default wallet for new transactions, archive
          ones you no longer use without losing their history, and label each with its own currency. You can also
          set a <span className="font-semibold text-foreground">default wallet for Activities</span> — which wallet
          its balance card and transaction list are scoped to when the page opens, separate from the default used
          for new transactions.
        </p>
        <SupportScreenshot src="wallets.jpg" alt="Settings > Wallets panel" />
      </>
    ),
  },
  {
    id: "budgeting",
    title: "Recurring transactions, budgets & savings goals",
    icon: <BudgetIcon />,
    body: (
      <>
        <p>
          All under <span className="font-semibold text-foreground">Settings &gt; Budgeting</span>. Recurring rules
          auto-log rent, subscriptions, or salary on a weekly/monthly/yearly schedule — pause, edit, skip a single
          upcoming occurrence, or reorder them. Budgets set a monthly spending limit per category, with an optional
          rollover of unused budget into the next month and a Dashboard alert when you&apos;re near or over. Savings
          goals track progress toward something you&apos;re saving for, with manual contribute/withdraw.
        </p>
        <SupportScreenshot src="budgeting.jpg" alt="Settings > Budgets panel" />
      </>
    ),
  },
  {
    id: "split-transactions",
    title: "Split transactions",
    icon: <SplitIcon />,
    body: (
      <>
        <p>
          From <span className="font-semibold text-foreground">Add &gt; Manual entry</span>, split one receipt
          across multiple categories in a single entry — it shows up as one grouped card in Activities, with each
          line still individually editable or deletable.
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
    title: "Dashboard",
    icon: <DashboardIcon />,
    body: (
      <>
        <p>
          Fully customizable — tap the paintbrush icon to enter the live editor, then add, remove, resize, or
          reorder any of 50+ widgets (stat cards, trend charts, progress rings, donut charts, heatmaps,
          leaderboards, and more) to build your own layout. Widgets you haven&apos;t customized are updated with new
          sensible defaults over time; once you&apos;ve arranged your own, it&apos;s yours to keep.
        </p>
        <SupportScreenshot src="dashboard-editor.jpg" alt="Customize dashboard live editor" />
      </>
    ),
  },
  {
    id: "activities",
    title: "Activities",
    icon: <ActivitiesIcon />,
    body: (
      <>
        <p>
          Your full transaction log. The balance card up top shows your wallet balance, with
          Expense/Income/Transfer buttons that filter the list below and a wallet-scope picker to view one wallet
          instead of all of them. The filter icon next to search opens Category, Tag, Wallet, and Date range
          filters, and you can export the currently filtered list as a CSV. Tap any transaction to open a read-only
          detail view — its category, wallet, tags, notes, and attached receipt — with an{" "}
          <span className="font-semibold text-foreground">Edit transaction</span> button if you actually want to
          change it, so a stray tap can&apos;t put you into editing by accident. Select multiple transactions to
          bulk-delete or bulk-tag them at once, or on mobile, swipe a transaction left or right for quick
          delete/share.
        </p>
        <SupportScreenshot src="activities.jpg" alt="Activities with a transaction's detail pane open" />
      </>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: <GearIcon className="h-4.5 w-4.5" />,
    body: (
      <>
        <p>
          Manage your account (username, password, email, connected GitHub account, account deletion, sign out of
          all devices), grant microphone/camera/photos permissions and manage email notifications, customize your
          expense and income categories and tags, switch light/dark theme, import/export CSV data, set your default
          currency (with optional automatic conversion for scanned, spoken, or Dashboard amounts in a different
          currency), and check the Error log if Tally has shown you an error message you want to report.
        </p>
        <SupportScreenshot src="account.jpg" alt="Settings > Account panel" />
      </>
    ),
  },
  {
    id: "offline",
    title: "Install & use offline",
    icon: <OfflineIcon />,
    body: (
      <>
        <p>
          Tally is an installable app — add it to your home screen from your browser&apos;s share/install menu. Once
          installed, it opens instantly, and if you open it with no connection you&apos;ll see a graceful offline
          page instead of an error (viewing existing data offline isn&apos;t supported yet).
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
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title="Usage Guide">
        <p className="-mt-3 mb-5 text-sm text-ink-soft">Everything Tally can do, in one place.</p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-navy hover:text-foreground"
            >
              {s.title}
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
                <h3 className="font-display text-lg text-foreground">{s.title}</h3>
              </div>
              <div className="text-sm leading-relaxed text-ink-soft">{s.body}</div>
            </section>
          ))}
        </div>
    </SettingsSubpageLayout>
  );
}
