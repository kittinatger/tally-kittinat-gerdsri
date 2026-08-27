"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CategoryOption } from "@/types/category";
import type { WalletOption } from "@/types/wallet";
import { CurrencyProvider } from "@/lib/currency-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { WalletsProvider } from "@/lib/wallets-context";
import { APP_VERSION } from "@/lib/version";
import { type Panel } from "@/lib/settings-panels";
import PullToRefresh from "./PullToRefresh";
import AppHeader from "./AppHeader";
import SettingsNavList from "./SettingsNavList";

// Exactly one of these renders at a time (whichever `panel` is selected), so
// loading them on demand instead of bundling all ~16 into every Settings
// visit meaningfully shrinks its initial JS.
const AccountPanel = dynamic(() => import("./AccountPanel"), { ssr: false });
const CurrencySettings = dynamic(() => import("./CurrencySettings"), { ssr: false });
const LanguageSettings = dynamic(() => import("./LanguageSettings"), { ssr: false });
const CalendarSettings = dynamic(() => import("./CalendarSettings"), { ssr: false });
const DashboardWidgetsSettings = dynamic(() => import("./DashboardWidgetsSettings"), { ssr: false });
const PermissionsSettings = dynamic(() => import("./PermissionsSettings"), { ssr: false });
const CategoryManager = dynamic(() => import("./CategoryManager"), { ssr: false });
const TagManager = dynamic(() => import("./TagManager"), { ssr: false });
const WalletManager = dynamic(() => import("./WalletManager"), { ssr: false });
const RecurringManager = dynamic(() => import("./RecurringManager"), { ssr: false });
const BudgetManager = dynamic(() => import("./BudgetManager"), { ssr: false });
const SavingsGoalsManager = dynamic(() => import("./SavingsGoalsManager"), { ssr: false });
const FriendsManager = dynamic(() => import("./FriendsManager"), { ssr: false });
const ChallengesManager = dynamic(() => import("./ChallengesManager"), { ssr: false });
const SplitBillManager = dynamic(() => import("./SplitBillManager"), { ssr: false });
const LoanManager = dynamic(() => import("./LoanManager"), { ssr: false });
const AssistantPanel = dynamic(() => import("./AssistantPanel"), { ssr: false });
const ApiTokensManager = dynamic(() => import("./ApiTokensManager"), { ssr: false });
const AutoImportInstructions = dynamic(() => import("./AutoImportInstructions"), { ssr: false });
const ErrorReportsPanel = dynamic(() => import("./ErrorReportsPanel"), { ssr: false });
const BackupSettingsPanel = dynamic(() => import("./BackupSettingsPanel"), { ssr: false });
const AppLockSettingsPanel = dynamic(() => import("./AppLockSettingsPanel"), { ssr: false });

const PANEL_TITLES: Record<Panel, string> = {
  account: "Account",
  permissions: "Permissions",
  categories: "Manage categories",
  tags: "Manage tags",
  wallets: "Wallets",
  friends: "Friends & Family",
  challenges: "Challenges",
  splitBills: "Split bills",
  loans: "Loans",
  assistant: "Assistant",
  currency: "Currency",
  language: "Language",
  calendar: "Calendar settings",
  dashboardWidgets: "Customize dashboard",
  recurring: "Recurring transactions",
  budgets: "Budgets",
  savingsGoals: "Savings goals",
  autoImport: "Automatic import",
  errorReports: "Error log",
  backup: "Backup & restore",
  appLock: "App lock",
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
      {/* "loans" and "assistant" are deliberately NOT in this list — like
       * "wallets", LoanManager/AssistantPanel render their own <h3> heading
       * (unlike e.g. SplitBillManager, which has none), so adding them here
       * would double up. */}
      {(panel === "currency" || panel === "language" || panel === "tags" || panel === "calendar" || panel === "friends" || panel === "challenges" || panel === "splitBills") && (
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
      {panel === "loans" && <LoanManager />}
      {panel === "assistant" && <AssistantPanel />}
      {panel === "currency" && <CurrencySettings />}
      {panel === "language" && <LanguageSettings />}
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
      {panel === "backup" && <BackupSettingsPanel />}
      {panel === "appLock" && <AppLockSettingsPanel />}
      {panel === "dashboardWidgets" && (
        <DashboardWidgetsSettings
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
              {/* Independent scroll regions at lg+ (each sticky under the
               * header, capped to the viewport, scrolling on its own) —
               * otherwise the list and detail panes share one page scroll,
               * so scrolling down a long nav list (to reach e.g. Changelog
               * near the bottom) drags the short detail pane down and out
               * of view with it. */}
              <div
                className={`${panel ? "hidden" : "block"} lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100dvh-104px)] lg:w-[320px] lg:shrink-0 lg:overflow-y-auto`}
              >
                {listContent}
              </div>
              <div className={`${panel ? "block" : "hidden"} lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100dvh-104px)] lg:flex-1 lg:overflow-y-auto`}>
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
