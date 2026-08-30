"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SunMoonIcon, UploadIcon } from "@/lib/icons";
import { type Panel } from "@/lib/settings-panels";
import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { useT } from "@/lib/language-context";
import SettingsSection from "./SettingsSection";
import SettingsListItem from "./SettingsListItem";
import ExportDataButton from "./ExportDataButton";
import ImportDataButton from "./ImportDataButton";
import ReportExportButton from "./ReportExportButton";

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

function AssistantIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 2.5c-3.6 0-6.5 2.5-6.5 5.75 0 1.85.95 3.5 2.45 4.6L5 17l3.35-1.5c.53.1 1.08.15 1.65.15 3.6 0 6.5-2.5 6.5-5.75S13.6 2.5 10 2.5Z" />
      <circle cx="7.25" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.75" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LoanIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 10c0-3.5 3-6.5 7-6.5s7 3 7 6.5-3 6.5-7 6.5c-1.2 0-2.3-.25-3.3-.7L3 17l1.3-3.6C3.5 12.4 3 11.3 3 10Z" />
      <path d="M7.5 10h5M10 7.5v5" />
    </svg>
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

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M2.75 10h14.5M10 2.75c2 2 3 4.7 3 7.25s-1 5.25-3 7.25c-2-2-3-4.7-3-7.25s1-5.25 3-7.25Z" />
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

function BackupIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5.5 8A4 4 0 0 1 13.4 6.4 3.25 3.25 0 0 1 16.5 9.5 3 3 0 0 1 13.5 12.5H6a3.5 3.5 0 0 1-.5-6.96Z" />
      <path d="M10 9.5v5.5M7.8 12.6l2.2 2.4 2.2-2.4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
      <circle cx="10" cy="12.75" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="8" width="14" height="9" rx="1.5" />
      <path d="M3 11.5h14M10 8v9" />
      <path d="M10 8C10 8 6.7 8 6.7 5.7 6.7 4.2 8 3.5 9 4c1 .5 1 4 1 4Z" />
      <path d="M10 8c0 0 3.3 0 3.3-2.3 0-1.5-1.3-2.2-2.3-1.7-1 .5-1 4-1 4Z" />
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

type PanelItemProps =
  | { mode: "panel"; panel: Panel | null; onSelectPanel: (panel: Panel) => void }
  | { mode: "link" };

/**
 * The persistent Settings nav list — the same profile banner + grouped
 * sections everywhere it's used, but the panel-switching rows behave
 * differently depending on where it's mounted:
 * - `mode="panel"` (inside SettingsView, at /settings): rows switch the
 *   in-app panel via state, no navigation.
 * - `mode="link"` (the standalone Support pages — FAQs, Usage guide, etc.):
 *   those pages don't have panel state of their own (they don't fetch the
 *   heavy data those panels need), so rows link to `/settings?panel=X`
 *   instead. href-based rows (Usage guide, FAQs, ...) highlight themselves
 *   via the current pathname instead.
 */
export default function SettingsNavList({
  username,
  email,
  ...panelProps
}: { username: string; email: string | null } & PanelItemProps) {
  const pathname = usePathname();
  const t = useT();
  const isAdmin = Boolean(email) && email!.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  function panelItemProps(panel: Panel) {
    if (panelProps.mode === "panel") {
      return { onClick: () => panelProps.onSelectPanel(panel), selected: panelProps.panel === panel };
    }
    return { href: `/settings?panel=${panel}` };
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <ProfileAvatar username={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-foreground">{username}</p>
          <p className="truncate text-xs text-ink-soft">{email ?? "No email on file"}</p>
        </div>
        <ThemeToggleButton />
      </div>

      <SettingsSection title={t("settings.section.appSettings")}>
        <SettingsListItem icon={<AccountIcon />} label={t("settings.account")} accent="slate" {...panelItemProps("account")} />
        <SettingsListItem icon={<ShieldIcon />} label={t("settings.permissions")} accent="slate" {...panelItemProps("permissions")} />
        <SettingsListItem icon={<LockIcon />} label={t("settings.appLock")} accent="rose" {...panelItemProps("appLock")} />
      </SettingsSection>

      {/* "Money" (was "Records") — every panel about what you own or owe:
       * wallets themselves plus the categorization/budgeting/recurring/
       * loan features built on top of them. Budgets/savings/recurring
       * used to sit in their own "Budgeting" section, separated from
       * wallets/categories for no real reason — they're all the same
       * "manage my money" mental bucket. */}
      <SettingsSection title={t("settings.section.records")}>
        <SettingsListItem icon={<WalletIcon />} label={t("settings.wallets")} accent="sky" {...panelItemProps("wallets")} />
        <SettingsListItem icon={<GridIcon />} label={t("settings.manageCategories")} accent="indigo" {...panelItemProps("categories")} />
        <SettingsListItem icon={<HashIcon />} label={t("settings.manageTags")} accent="indigo" {...panelItemProps("tags")} />
        <SettingsListItem icon={<BudgetIcon />} label={t("settings.budgets")} accent="orange" {...panelItemProps("budgets")} />
        <SettingsListItem icon={<GoalIcon />} label={t("settings.savingsGoals")} accent="emerald" {...panelItemProps("savingsGoals")} />
        <SettingsListItem icon={<RecurringIcon />} label={t("settings.recurring")} accent="teal" {...panelItemProps("recurring")} />
        <SettingsListItem icon={<LoanIcon />} label={t("settings.loans")} accent="teal" {...panelItemProps("loans")} />
      </SettingsSection>

      <SettingsSection title={t("settings.section.social")}>
        <SettingsListItem icon={<FriendsIcon />} label={t("settings.friends")} accent="pink" {...panelItemProps("friends")} />
        <SettingsListItem icon={<TrophyNavIcon />} label={t("settings.challenges")} accent="violet" {...panelItemProps("challenges")} />
        <SettingsListItem icon={<ReceiptNavIcon />} label={t("settings.splitBills")} accent="amber" {...panelItemProps("splitBills")} />
        <SettingsListItem icon={<AssistantIcon />} label={t("settings.assistant")} accent="violet" {...panelItemProps("assistant")} />
      </SettingsSection>

      {/* Everything that moves data in/out of the app rather than being a
       * feature you use day to day — export/import/backup, automatic
       * import, and the error log and pending-changes queue (both
       * diagnostic, not "support" in the FAQ/contact sense below). */}
      <SettingsSection title={t("settings.section.data")}>
        <ExportDataButton />
        <ImportDataButton />
        <ReportExportButton />
        <SettingsListItem icon={<AutoImportIcon />} label={t("settings.autoImport")} accent="cyan" {...panelItemProps("autoImport")} />
        <SettingsListItem icon={<BackupIcon />} label={t("settings.backup")} accent="cyan" {...panelItemProps("backup")} />
        <SettingsListItem icon={<WarningIcon />} label={t("settings.errorLog")} accent="amber" {...panelItemProps("errorReports")} />
        <SettingsListItem icon={<RecurringIcon />} label={t("settings.pendingChanges")} accent="teal" {...panelItemProps("pendingChanges")} />
      </SettingsSection>

      {/* Admin-only — hidden entirely for every other account, not just its
       * items grayed out, so it never advertises a capability that account
       * doesn't have. Currently just template moderation, but a dedicated
       * section (rather than folding it into Data & Backup) gives future
       * admin-only tools a home without cluttering the regular sections
       * every user sees. */}
      {isAdmin && (
        <SettingsSection title={t("settings.section.admin")}>
          <SettingsListItem icon={<UploadIcon className="h-5 w-5" />} label={t("wallet.templateReviewTitle")} accent="indigo" {...panelItemProps("templateReviews")} />
        </SettingsSection>
      )}

      <SettingsSection title={t("settings.section.display")}>
        <SettingsListItem icon={<DashboardWidgetsIcon />} label={t("settings.dashboardWidgets")} accent="fuchsia" {...panelItemProps("dashboardWidgets")} />
        <SettingsListItem icon={<CalendarIcon />} label={t("settings.calendar")} accent="blue" {...panelItemProps("calendar")} />
        <SettingsListItem icon={<CoinIcon />} label={t("settings.currency")} accent="green" {...panelItemProps("currency")} />
        <SettingsListItem icon={<GlobeIcon />} label={t("settings.language")} accent="sky" {...panelItemProps("language")} />
      </SettingsSection>

      <SettingsSection title={t("settings.section.support")}>
        <SettingsListItem icon={<GiftIcon />} label={t("settings.referFriend")} accent="pink" href="/refer-a-friend" selected={pathname === "/refer-a-friend"} />
        <SettingsListItem icon={<BookIcon />} label={t("settings.usageGuide")} accent="indigo" href="/usage-guide" selected={pathname === "/usage-guide"} />
        <SettingsListItem icon={<QuestionIcon />} label={t("settings.faqs")} accent="violet" href="/faq" selected={pathname === "/faq"} />
        <SettingsListItem icon={<WrenchIcon />} label={t("settings.troubleshooting")} accent="orange" href="/troubleshooting" selected={pathname === "/troubleshooting"} />
        <SettingsListItem icon={<MailIcon />} label={t("settings.contact")} accent="sky" href="/contact" selected={pathname === "/contact"} />
        <SettingsListItem icon={<FlagIcon />} label={t("settings.reportIssue")} accent="rose" href="/report-issue" selected={pathname === "/report-issue"} />
        <SettingsListItem icon={<ClockIcon />} label={t("settings.changelog")} accent="slate" href="/changelog" selected={pathname === "/changelog"} />
      </SettingsSection>
    </div>
  );
}
