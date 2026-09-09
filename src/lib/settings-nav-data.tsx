// The Settings home content — one source of truth for every section/row
// (icon, label key, accent color, and where it goes), shared by every
// selectable Settings-page layout (Settings > Settings page design). Pure
// data + stateless icon components (no hooks), so it can be imported by
// any of the layout renderers without duplicating the ~40 rows across
// them — only each layout's own header/section/row chrome differs.
import type { Panel } from "@/lib/settings-panels";
import type { MessageKey } from "@/lib/i18n/messages";

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

function StoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 7.5 4 3h12l1 4.5" />
      <path d="M3 7.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M4 8v8.5h12V8" />
      <path d="M8 16.5V12h4v4.5" />
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

function NavBarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="12.5" width="15" height="5" rx="2.5" />
      <circle cx="7" cy="15" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="2.5" width="15" height="4.5" rx="1.5" />
      <rect x="2.5" y="9" width="6.5" height="8.5" rx="1.5" />
      <rect x="11" y="9" width="6.5" height="8.5" rx="1.5" />
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

function QrCodeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1" />
      <rect x="12" y="2.5" width="5.5" height="5.5" rx="1" />
      <rect x="2.5" y="12" width="5.5" height="5.5" rx="1" />
      <path d="M12 12h2.25v2.25M12 16.75h2.25M16.75 12v1.75M16.75 16.75v.01" />
    </svg>
  );
}

function ScannerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13" />
      <path d="M4 10h12" />
    </svg>
  );
}

function ConverterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 7h11l-3-3M16 13H5l3 3" />
      <circle cx="10" cy="10" r="7.25" />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M15 5 5 15" />
      <circle cx="6" cy="6" r="1.75" />
      <circle cx="14" cy="14" r="1.75" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3.5" y="2.5" width="13" height="15" rx="2" />
      <path d="M6.5 5.5h7" />
      <path d="M6.5 9.5h.01M10 9.5h.01M13.5 9.5h.01M6.5 12.5h.01M10 12.5h.01M13.5 12.5h.01M6.5 15.5h.01M10 15.5h.01M13.5 15.5h.01" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.3 5.3l2.1 2.1M12.6 12.6l2.1 2.1M14.7 5.3l-2.1 2.1M7.4 12.6l-2.1 2.1" />
      <circle cx="10" cy="10" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CardGuidelinesIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="5.3" width="16" height="9.4" rx="1.8" />
      <path d="M2 8.2h16" />
      <path d="M4.5 11.5h3" />
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

function KeyboardNavIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="5" width="16" height="10" rx="1.8" />
      <path d="M5 8h.01M8 8h.01M11 8h.01M14 8h.01M5 11.5h8" />
    </svg>
  );
}

function UploadReviewIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10 12.5V3.5M6.5 7l3.5-3.5L13.5 7" />
      <path d="M3.5 13v2a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export type SettingsAccent = string;

export type SettingsRowData =
  | { kind: "panel"; icon: React.ReactNode; labelKey: MessageKey; accent?: SettingsAccent; panel: Panel }
  | { kind: "href"; icon: React.ReactNode; labelKey: MessageKey; accent?: SettingsAccent; href: string }
  | { kind: "special"; special: "export" | "import" | "reportExport" };

export type SettingsSectionData = {
  titleKey: MessageKey;
  rows: SettingsRowData[];
  /** Hidden entirely for every non-admin account (see ADMIN_EMAIL). */
  adminOnly?: boolean;
};

// Every section/row the Settings home shows, in display order — the one
// source every selectable layout (Settings > Settings page design) reads
// from instead of re-declaring its own copy.
export const SETTINGS_SECTIONS: SettingsSectionData[] = [
  // Reordered so the everyday-use sections (Account, Money, Organize,
  // Social, Display) come before the more peripheral ones (AI & Tools,
  // Data & Backup, Admin, Support), instead of the previous order that
  // put Tools/AI ahead of Money for no real reason. AI (2 rows) and
  // Tools (5 rows) — two small, related grab-bags — are also merged
  // into one "AI & Tools" section, so there's one fewer section header
  // to scroll past overall.
  {
    titleKey: "settings.section.appSettings",
    rows: [
      { kind: "panel", icon: <AccountIcon />, labelKey: "settings.account", accent: "slate", panel: "account" },
      { kind: "panel", icon: <ShieldIcon />, labelKey: "settings.permissions", accent: "slate", panel: "permissions" },
      { kind: "panel", icon: <LockIcon />, labelKey: "settings.appLock", accent: "rose", panel: "appLock" },
    ],
  },
  {
    titleKey: "settings.section.records",
    rows: [
      { kind: "panel", icon: <WalletIcon />, labelKey: "settings.wallets", accent: "sky", panel: "wallets" },
      { kind: "panel", icon: <BudgetIcon />, labelKey: "settings.budgets", accent: "orange", panel: "budgets" },
      { kind: "panel", icon: <GoalIcon />, labelKey: "settings.savingsGoals", accent: "emerald", panel: "savingsGoals" },
      { kind: "panel", icon: <RecurringIcon />, labelKey: "settings.recurring", accent: "teal", panel: "recurring" },
      { kind: "panel", icon: <LoanIcon />, labelKey: "settings.loans", accent: "teal", panel: "loans" },
    ],
  },
  {
    titleKey: "settings.section.organize",
    rows: [
      { kind: "panel", icon: <GridIcon />, labelKey: "settings.manageCategories", accent: "indigo", panel: "categories" },
      { kind: "panel", icon: <HashIcon />, labelKey: "settings.manageTags", accent: "indigo", panel: "tags" },
      { kind: "panel", icon: <StoreIcon />, labelKey: "settings.vendors", accent: "indigo", panel: "vendors" },
      { kind: "panel", icon: <ReceiptNavIcon />, labelKey: "settings.activities", accent: "indigo", panel: "activities" },
    ],
  },
  {
    titleKey: "settings.section.social",
    rows: [
      { kind: "panel", icon: <FriendsIcon />, labelKey: "settings.friends", accent: "pink", panel: "friends" },
      { kind: "panel", icon: <TrophyNavIcon />, labelKey: "settings.challenges", accent: "violet", panel: "challenges" },
      { kind: "panel", icon: <ReceiptNavIcon />, labelKey: "settings.splitBills", accent: "amber", panel: "splitBills" },
    ],
  },
  {
    titleKey: "settings.section.display",
    rows: [
      { kind: "panel", icon: <CalendarIcon />, labelKey: "settings.calendar", accent: "blue", panel: "calendar" },
      { kind: "panel", icon: <NavBarIcon />, labelKey: "settings.navStyle", accent: "violet", panel: "navStyle" },
      { kind: "panel", icon: <LayoutIcon />, labelKey: "settings.settingsHomeStyle", accent: "fuchsia", panel: "settingsHomeStyle" },
      { kind: "panel", icon: <CoinIcon />, labelKey: "settings.currency", accent: "green", panel: "currency" },
      { kind: "panel", icon: <GlobeIcon />, labelKey: "settings.language", accent: "sky", panel: "language" },
      { kind: "panel", icon: <KeyboardNavIcon />, labelKey: "settings.keyboardShortcuts", accent: "slate", panel: "keyboardShortcuts" },
    ],
  },
  {
    titleKey: "settings.section.ai",
    rows: [
      { kind: "panel", icon: <AssistantIcon />, labelKey: "settings.assistant", accent: "violet", panel: "assistant" },
      { kind: "panel", icon: <SparkleIcon />, labelKey: "settings.aiUsage", accent: "violet", panel: "aiUsage" },
      { kind: "panel", icon: <QrCodeIcon />, labelKey: "settings.codeGenerator", accent: "indigo", panel: "codeGenerator" },
      { kind: "panel", icon: <ScannerIcon />, labelKey: "settings.codeScanner", accent: "indigo", panel: "codeScanner" },
      { kind: "panel", icon: <ConverterIcon />, labelKey: "settings.currencyConverter", accent: "green", panel: "currencyConverter" },
      { kind: "panel", icon: <PercentIcon />, labelKey: "settings.discountCalculator", accent: "orange", panel: "discountCalculator" },
      { kind: "panel", icon: <CalculatorIcon />, labelKey: "settings.loanCalculator", accent: "teal", panel: "loanCalculator" },
    ],
  },
  {
    titleKey: "settings.section.data",
    rows: [
      { kind: "special", special: "export" },
      { kind: "special", special: "import" },
      { kind: "special", special: "reportExport" },
      { kind: "panel", icon: <AutoImportIcon />, labelKey: "settings.autoImport", accent: "cyan", panel: "autoImport" },
      { kind: "panel", icon: <BackupIcon />, labelKey: "settings.backup", accent: "cyan", panel: "backup" },
      { kind: "panel", icon: <WarningIcon />, labelKey: "settings.errorLog", accent: "amber", panel: "errorReports" },
      { kind: "panel", icon: <RecurringIcon />, labelKey: "settings.pendingChanges", accent: "teal", panel: "pendingChanges" },
    ],
  },
  {
    titleKey: "settings.section.admin",
    adminOnly: true,
    rows: [
      { kind: "panel", icon: <UploadReviewIcon />, labelKey: "wallet.templateReviewTitle", accent: "indigo", panel: "templateReviews" },
      { kind: "panel", icon: <UploadReviewIcon />, labelKey: "membership.passTemplateReviewTitle", accent: "indigo", panel: "passTemplateReviews" },
    ],
  },
  {
    titleKey: "settings.section.support",
    rows: [
      { kind: "href", icon: <GiftIcon />, labelKey: "settings.referFriend", accent: "pink", href: "/refer-a-friend" },
      { kind: "href", icon: <BookIcon />, labelKey: "settings.usageGuide", accent: "indigo", href: "/usage-guide" },
      { kind: "href", icon: <CardGuidelinesIcon />, labelKey: "settings.cardGuidelines", accent: "sky", href: "/card-guidelines" },
      { kind: "href", icon: <ReceiptNavIcon />, labelKey: "settings.passGuidelines", accent: "sky", href: "/pass-guidelines" },
      { kind: "href", icon: <QuestionIcon />, labelKey: "settings.faqs", accent: "violet", href: "/faq" },
      { kind: "href", icon: <WrenchIcon />, labelKey: "settings.troubleshooting", accent: "orange", href: "/troubleshooting" },
      { kind: "href", icon: <MailIcon />, labelKey: "settings.contact", accent: "sky", href: "/contact" },
      { kind: "href", icon: <FlagIcon />, labelKey: "settings.reportIssue", accent: "rose", href: "/report-issue" },
      { kind: "href", icon: <ClockIcon />, labelKey: "settings.changelog", accent: "slate", href: "/changelog" },
    ],
  },
];
