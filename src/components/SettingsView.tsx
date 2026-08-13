"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import type { Expense } from "@/types/expense";
import { CurrencyProvider } from "@/lib/currency-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { APP_VERSION } from "@/lib/version";
import { type Panel } from "@/lib/settings-panels";
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
import RecurringManager from "./RecurringManager";
import BudgetManager from "./BudgetManager";
import SavingsGoalsManager from "./SavingsGoalsManager";
import FriendsManager from "./FriendsManager";
import ChallengesManager from "./ChallengesManager";
import SplitBillManager from "./SplitBillManager";
import ApiTokensManager from "./ApiTokensManager";
import AutoImportInstructions from "./AutoImportInstructions";
import ErrorReportsPanel from "./ErrorReportsPanel";
import SettingsNavList from "./SettingsNavList";

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
  initialPanel,
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
  /** Deep-links straight into a panel — used when arriving via `?panel=X`
   * from the persistent nav list on a standalone Support page (those pages
   * don't have panel state of their own, so their nav rows link here). */
  initialPanel?: Panel;
}) {
  // Land straight in Account (rather than the Settings list) when arriving
  // fresh from a GitHub-link redirect, so the result is immediately visible
  // instead of requiring another tap to find it.
  const [panel, setPanel] = useState<Panel | null>(
    githubLinked || githubError ? "account" : (initialPanel ?? null),
  );
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
  const listContent = <SettingsNavList mode="panel" username={username} email={email} panel={panel} onSelectPanel={setPanel} />;

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
