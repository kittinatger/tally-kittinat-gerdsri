"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import type { Expense } from "@/types/expense";
import { CurrencyProvider } from "@/lib/currency-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { APP_VERSION } from "@/lib/version";
import PullToRefresh from "./PullToRefresh";
import AppHeader from "./AppHeader";
import AccountPanel from "./AccountPanel";
import CurrencySettings from "./CurrencySettings";
import CalendarSettings from "./CalendarSettings";
import DashboardWidgetsSettings from "./DashboardWidgetsSettings";
import PermissionsSettings from "./PermissionsSettings";
import CategoryManager from "./CategoryManager";
import TagManager from "./TagManager";
import WalletManager from "./WalletManager";
import ExportDataButton from "./ExportDataButton";
import ImportDataButton from "./ImportDataButton";
import RecurringManager from "./RecurringManager";
import BudgetManager from "./BudgetManager";
import SavingsGoalsManager from "./SavingsGoalsManager";
import FriendsManager from "./FriendsManager";
import ChallengesManager from "./ChallengesManager";
import SplitBillManager from "./SplitBillManager";
import ApiTokensManager from "./ApiTokensManager";
import AutoImportInstructions from "./AutoImportInstructions";
import ErrorReportsPanel from "./ErrorReportsPanel";
import SettingsSection from "./SettingsSection";
import SettingsListItem from "./SettingsListItem";
import { SunMoonIcon } from "@/lib/icons";

type Panel =
  | "account"
  | "permissions"
  | "categories"
  | "tags"
  | "wallets"
  | "friends"
  | "challenges"
  | "splitBills"
  | "currency"
  | "calendar"
  | "dashboardWidgets"
  | "recurring"
  | "budgets"
  | "savingsGoals"
  | "autoImport"
  | "errorReports";

const PANEL_TITLES: Record<Panel, string> = {
  account: "Account",
  permissions: "Permissions",
  categories: "Manage categories",
  tags: "Manage tags",
  wallets: "Wallets",
  friends: "Friends & Family",
  challenges: "Challenges",
  splitBills: "Split bills",
  currency: "Currency",
  calendar: "Calendar settings",
  dashboardWidgets: "Customize dashboard",
  recurring: "Recurring transactions",
  budgets: "Budgets",
  savingsGoals: "Savings goals",
  autoImport: "Automatic import",
  errorReports: "Error log",
};

function AccountIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="6.5" r="3.25" />
      <path d="M3.5 17c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 2.5l6 2.2v4.8c0 4.2-2.6 6.9-6 8-3.4-1.1-6-3.8-6-8V4.7Z" />
      <path d="M7.5 10l1.8 1.8L13 8.2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.75" y="2.75" width="6" height="6" rx="1.5" />
      <rect x="11.25" y="2.75" width="6" height="6" rx="1.5" />
      <rect x="2.75" y="11.25" width="6" height="6" rx="1.5" />
      <rect x="11.25" y="11.25" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M7.5 2.5L5.5 17.5M14.5 2.5l-2 15M3 7h14M2.5 13h14" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v8A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5Z" />
      <path d="M3 8.5h13.5A1.5 1.5 0 0 1 18 10v4a1.5 1.5 0 0 1-1.5 1.5" />
      <circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="7" cy="6.5" r="2.75" />
      <path d="M1.5 17c0-3 2.46-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="14.5" cy="7" r="2.25" />
      <path d="M12.9 12.3c2.53.24 4.6 2.13 4.6 4.7" />
    </svg>
  );
}

function ReceiptNavIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3v-15Z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </svg>
  );
}

function TrophyNavIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M6 3h8v4a4 4 0 0 1-8 0V3Z" />
      <path d="M6 4H3.5a1 1 0 0 0-1 1.2l.4 1.6A2 2 0 0 0 4.85 8.3H6M14 4h2.5a1 1 0 0 1 1 1.2l-.4 1.6a2 2 0 0 1-1.95 1.5H14" />
      <path d="M8 12v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2M7 17h6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" />
    </svg>
  );
}

function DashboardWidgetsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="4.5" rx="1.5" />
      <rect x="11.5" y="9" width="6" height="8.5" rx="1.5" />
      <rect x="2.5" y="11.5" width="7" height="6" rx="1.5" />
    </svg>
  );
}

// Was its own settings panel (a single toggle button and nothing else) —
// folded inline into the top of the Settings list instead, since a whole
// navigation tap for one button was more empty page than setting.
function ThemeToggleButton() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tally-theme", next);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the toggle
      // still works for the current session either way.
    }
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-soft text-ink-soft transition hover:text-foreground"
    >
      <SunMoonIcon />
    </button>
  );
}

// Anchors the top of the Settings list with the same profile picture used
// on the Dashboard's Welcome widget, so Settings reads as "your account"
// rather than a bare list of links.
function ProfileAvatar({ username }: { username: string }) {
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/profile-picture", { cache: "no-store" })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!cancelled && blob) setPictureUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        // Leave it blank — the initial-letter fallback below still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={pictureUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-surface-accent" />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-accent/10">
      <span className="text-lg font-bold text-surface-accent">{username.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M12.2 7.6c-.4-.7-1.2-1.1-2.2-1.1-1.5 0-2.6 1-2.6 2.3 0 1.1.8 1.8 2.1 2.1l1 .2c1.3.3 2.1 1 2.1 2.1 0 1.3-1.1 2.3-2.7 2.3-1.1 0-2-.4-2.4-1.2" />
      <path d="M10 5.3v9.4" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 5.2C8.9 4 7 3.3 3.5 3.3v11c3.5 0 5.4.7 6.5 1.9 1.1-1.2 3-1.9 6.5-1.9v-11C13 3.3 11.1 4 10 5.2Z" />
      <path d="M10 5.2v11.5" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M7.9 8a2.15 2.15 0 0 1 4.2.7c0 1.4-2.1 1.6-2.1 3.1" />
      <circle cx="10" cy="14.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 5.5 10 11l7-5.5" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 17.5v-15" />
      <path d="M5 3.5h9l-2.3 3.5L14 10.5H5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 3.2 17.3 15.8a1 1 0 0 1-.87 1.5H3.57a1 1 0 0 1-.87-1.5L10 3.2Z" />
      <path d="M10 8.3v3.4" />
      <circle cx="10" cy="14.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M13.8 3.7a4.2 4.2 0 0 0-5.6 5.1L3.4 13.6l3 3 4.8-4.8a4.2 4.2 0 0 0 5.1-5.6l-2.7 2.7-2.1-2.1Z" />
    </svg>
  );
}

function RecurringIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4.4 8.2A6 6 0 0 1 15.8 6l1.7 1.7" />
      <path d="M17.6 4.5v3.5h-3.5" />
      <path d="M15.6 11.8A6 6 0 0 1 4.2 14l-1.7-1.7" />
      <path d="M2.4 15.5V12h3.5" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 2.5v7.5h7.5A7.5 7.5 0 1 1 10 2.5Z" />
      <path d="M13 2.9A7.5 7.5 0 0 1 17.1 7H10Z" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AutoImportIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="3.5" width="12" height="10" rx="2" />
      <circle cx="6.5" cy="7.5" r="1.25" />
      <path d="M14.5 10.5 11 7l-5 5" />
      <path d="M17 12v3.5M15.2 14.2l1.8 1.8 1.8-1.8" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M12.5 4.5l-6 5.5 6 5.5" />
    </svg>
  );
}

export default function SettingsView({
  categories,
  currency,
  username,
  email,
  wallets,
  expenses,
  remaining,
  activitiesDefaultWalletId,
  githubLinked,
  githubError,
}: {
  categories: CategoryOption[];
  currency: string;
  username: string;
  email: string | null;
  wallets: WalletOption[];
  expenses: Expense[];
  remaining: number;
  /** Which wallet Activities' balance card is scoped to by default; null means "All wallets". */
  activitiesDefaultWalletId: number | null;
  /** True right after a redirect back from /api/auth/github/link succeeded. */
  githubLinked?: boolean;
  /** Error code from a failed /api/auth/github/link redirect, if any. */
  githubError?: string;
}) {
  // Land straight in Account (rather than the Settings list) when arriving
  // fresh from a GitHub-link redirect, so the result is immediately visible
  // instead of requiring another tap to find it.
  const [panel, setPanel] = useState<Panel | null>(githubLinked || githubError ? "account" : null);
  const activeWallets = wallets.filter((w) => !w.archived);

  // Below lg: a drill-down (list OR detail, with a Back button). At lg+: a
  // persistent two-pane layout (list always visible left, detail — or an
  // empty state — right), same as e.g. macOS System Settings. Both panes
  // below are each rendered exactly once (not duplicated per breakpoint) —
  // several panels (WalletManager, RecurringManager, etc.) fetch their own
  // data on mount, so mounting two copies would double those requests.
  // Visibility per breakpoint is driven purely by Tailwind classes (the
  // same `hidden ... sm:flex` technique AppHeader.tsx uses for its nav),
  // so there's no client-only breakpoint detection and no flash on load.
  const listContent = (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <ProfileAvatar username={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-foreground">{username}</p>
          <p className="truncate text-xs text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      <SettingsSection title="App settings">
        <SettingsListItem icon={<AccountIcon />} label="Account" accent="slate" selected={panel === "account"} onClick={() => setPanel("account")} />
        <SettingsListItem icon={<ShieldIcon />} label="Permissions" accent="slate" selected={panel === "permissions"} onClick={() => setPanel("permissions")} />
      </SettingsSection>

      <SettingsSection title="Records">
        <SettingsListItem icon={<GridIcon />} label="Manage categories" accent="indigo" selected={panel === "categories"} onClick={() => setPanel("categories")} />
        <SettingsListItem icon={<HashIcon />} label="Manage tags" accent="indigo" selected={panel === "tags"} onClick={() => setPanel("tags")} />
        <SettingsListItem icon={<WalletIcon />} label="Wallets" accent="sky" selected={panel === "wallets"} onClick={() => setPanel("wallets")} />
        <ExportDataButton />
        <ImportDataButton />
      </SettingsSection>

      <SettingsSection title="Social">
        <SettingsListItem icon={<FriendsIcon />} label="Friends & Family" accent="pink" selected={panel === "friends"} onClick={() => setPanel("friends")} />
        <SettingsListItem icon={<TrophyNavIcon />} label="Challenges" accent="violet" selected={panel === "challenges"} onClick={() => setPanel("challenges")} />
        <SettingsListItem icon={<ReceiptNavIcon />} label="Split bills" accent="amber" selected={panel === "splitBills"} onClick={() => setPanel("splitBills")} />
      </SettingsSection>

      <SettingsSection title="Budgeting">
        <SettingsListItem icon={<RecurringIcon />} label="Recurring transactions" accent="teal" selected={panel === "recurring"} onClick={() => setPanel("recurring")} />
        <SettingsListItem icon={<BudgetIcon />} label="Budgets" accent="orange" selected={panel === "budgets"} onClick={() => setPanel("budgets")} />
        <SettingsListItem icon={<GoalIcon />} label="Savings goals" accent="emerald" selected={panel === "savingsGoals"} onClick={() => setPanel("savingsGoals")} />
        <SettingsListItem icon={<AutoImportIcon />} label="Automatic import" accent="cyan" selected={panel === "autoImport"} onClick={() => setPanel("autoImport")} />
      </SettingsSection>

      <SettingsSection title="Display">
        <SettingsListItem
          icon={<DashboardWidgetsIcon />}
          label="Customize dashboard"
          accent="fuchsia"
          selected={panel === "dashboardWidgets"}
          onClick={() => setPanel("dashboardWidgets")}
        />
        <SettingsListItem icon={<CalendarIcon />} label="Calendar settings" accent="blue" selected={panel === "calendar"} onClick={() => setPanel("calendar")} />
        <SettingsListItem icon={<CoinIcon />} label="Currency" accent="green" selected={panel === "currency"} onClick={() => setPanel("currency")} />
      </SettingsSection>

      <SettingsSection title="Support" defaultOpen={false}>
        <SettingsListItem icon={<BookIcon />} label="Usage guide" href="/usage-guide" />
        <SettingsListItem icon={<QuestionIcon />} label="FAQs" href="/faq" />
        <SettingsListItem icon={<WrenchIcon />} label="Troubleshooting" href="/troubleshooting" />
        <SettingsListItem icon={<WarningIcon />} label="Error log" selected={panel === "errorReports"} onClick={() => setPanel("errorReports")} />
        <SettingsListItem icon={<MailIcon />} label="Contact" href="/contact" />
        <SettingsListItem icon={<FlagIcon />} label="Report an issue" href="/report-issue" />
        <SettingsListItem icon={<ClockIcon />} label="Changelog" href="/changelog" />
      </SettingsSection>
    </div>
  );

  const detailContent = panel && (
    <div>
      {panel !== "dashboardWidgets" && (
        <button
          type="button"
          onClick={() => setPanel(null)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-foreground lg:hidden"
        >
          <BackIcon />
          Settings
        </button>
      )}
      {(panel === "currency" || panel === "tags" || panel === "calendar" || panel === "friends" || panel === "challenges" || panel === "splitBills") && (
        <h2 className="mb-5 font-display text-2xl text-foreground">{PANEL_TITLES[panel]}</h2>
      )}

      {panel === "account" && (
        <AccountPanel
          initialUsername={username}
          initialEmail={email}
          githubLinked={githubLinked}
          githubError={githubError}
        />
      )}
      {panel === "permissions" && <PermissionsSettings hasEmail={Boolean(email)} />}
      {panel === "categories" && <CategoryManager categories={categories} />}
      {panel === "tags" && <TagManager />}
      {panel === "wallets" && (
        <WalletManager wallets={wallets} initialActivitiesDefaultWalletId={activitiesDefaultWalletId} />
      )}
      {panel === "friends" && <FriendsManager />}
      {panel === "challenges" && <ChallengesManager />}
      {panel === "splitBills" && <SplitBillManager />}
      {panel === "currency" && <CurrencySettings />}
      {panel === "calendar" && <CalendarSettings />}
      {panel === "recurring" && <RecurringManager />}
      {panel === "budgets" && <BudgetManager />}
      {panel === "savingsGoals" && <SavingsGoalsManager />}
      {panel === "autoImport" && (
        <div>
          <ApiTokensManager />
          <AutoImportInstructions />
        </div>
      )}
      {panel === "errorReports" && <ErrorReportsPanel />}
      {panel === "dashboardWidgets" && (
        <DashboardWidgetsSettings
          expenses={expenses}
          categories={categories}
          remaining={remaining}
          wallets={wallets}
          onDone={() => setPanel(null)}
        />
      )}
    </div>
  );

  const detailEmptyState = (
    <div className="hidden h-64 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line px-6 text-center lg:flex">
      <p className="text-sm font-medium text-foreground">Choose a setting</p>
      <p className="text-xs text-ink-soft">Pick something from the list to see it here.</p>
    </div>
  );

  return (
    <CategoriesProvider categories={categories}>
    <WalletsProvider wallets={activeWallets}>
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
        <PullToRefresh>
          <AppHeader />

          <main className="flex-1 px-1 py-6 sm:px-2">
            <div className="lg:flex lg:items-start lg:gap-6">
              <div className={`${panel ? "hidden" : "block"} lg:block lg:w-[320px] lg:shrink-0`}>{listContent}</div>
              <div className={`${panel ? "block" : "hidden"} lg:block lg:flex-1`}>
                {panel ? detailContent : detailEmptyState}
              </div>
            </div>

            <footer className="mt-12 flex flex-col items-center gap-2 border-t border-line pt-6 text-center text-xs text-ink-soft">
              <p>Tally v{APP_VERSION}</p>
              <p className="flex items-center gap-3">
                <Link href="/privacy" className="hover:text-foreground hover:underline">
                  Privacy Policy
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/terms" className="hover:text-foreground hover:underline">
                  Terms of Service
                </Link>
              </p>
            </footer>
          </main>
        </PullToRefresh>
      </div>
    </CurrencyProvider>
    </WalletsProvider>
    </CategoriesProvider>
  );
}
