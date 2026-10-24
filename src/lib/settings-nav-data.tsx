// The Settings home content — one source of truth for every section/row
// (icon, label key, accent color, and where it goes), read by the Settings
// list and the command palette. Pure data + stateless icon components (no
// hooks), so either can import it without duplicating the ~40 rows.
import type { Panel } from "@/lib/settings-panels";
import type { MessageKey } from "@/lib/i18n/messages";
import { BookOpenIcon as PhBookOpenIcon, CalculatorIcon as PhCalculatorIcon, CalendarBlankIcon as PhCalendarBlankIcon, ChartPieSliceIcon as PhChartPieSliceIcon, ChatCircleDotsIcon as PhChatCircleDotsIcon, CircleHalfIcon as PhCircleHalfIcon, ClipboardTextIcon as PhClipboardTextIcon, ClockCounterClockwiseIcon as PhClockCounterClockwiseIcon, CloudArrowUpIcon as PhCloudArrowUpIcon, CoinsIcon as PhCoinsIcon, CurrencyCircleDollarIcon as PhCurrencyCircleDollarIcon, EnvelopeIcon as PhEnvelopeIcon, FlagIcon as PhFlagIcon, GiftIcon as PhGiftIcon, GlobeIcon as PhGlobeIcon, HandshakeIcon as PhHandshakeIcon, HashIcon as PhHashIcon, IdentificationCardIcon as PhIdentificationCardIcon, ImagesIcon as PhImagesIcon, KeyboardIcon as PhKeyboardIcon, LockSimpleIcon as PhLockSimpleIcon, PercentIcon as PhPercentIcon, QrCodeIcon as PhQrCodeIcon, QuestionIcon as PhQuestionIcon, ReceiptIcon as PhReceiptIcon, RepeatIcon as PhRepeatIcon, ScanIcon as PhScanIcon, ShieldCheckIcon as PhShieldCheckIcon, SparkleIcon as PhSparkleIcon, SquaresFourIcon as PhSquaresFourIcon, StorefrontIcon as PhStorefrontIcon, TargetIcon as PhTargetIcon, TrophyIcon as PhTrophyIcon, UserIcon as PhUserIcon, UsersIcon as PhUsersIcon, WalletIcon as PhWalletIcon, WarningIcon as PhWarningIcon, WrenchIcon as PhWrenchIcon } from "@phosphor-icons/react/dist/ssr";

function AccountIcon() {
  return <PhUserIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function ShieldIcon() {
  return <PhShieldCheckIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function GridIcon() {
  return <PhSquaresFourIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function HashIcon() {
  return <PhHashIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function StoreIcon() {
  return <PhStorefrontIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function WalletIcon() {
  return <PhWalletIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function FriendsIcon() {
  return <PhUsersIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function ReceiptNavIcon() {
  return <PhReceiptIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function TrophyNavIcon() {
  return <PhTrophyIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function CalendarIcon() {
  return <PhCalendarBlankIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function AssistantIcon() {
  return <PhChatCircleDotsIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function LoanIcon() {
  return <PhHandshakeIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function CoinIcon() {
  return <PhCoinsIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function DesignIcon() {
  return <PhCircleHalfIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function GlobeIcon() {
  return <PhGlobeIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function BookIcon() {
  return <PhBookOpenIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function QuestionIcon() {
  return <PhQuestionIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function MailIcon() {
  return <PhEnvelopeIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function FlagIcon() {
  return <PhFlagIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function ClockIcon() {
  return <PhClockCounterClockwiseIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function WarningIcon() {
  return <PhWarningIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function WrenchIcon() {
  return <PhWrenchIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function RecurringIcon() {
  return <PhRepeatIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function BudgetIcon() {
  return <PhChartPieSliceIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function GoalIcon() {
  return <PhTargetIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function BackupIcon() {
  return <PhCloudArrowUpIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function LockIcon() {
  return <PhLockSimpleIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function GiftIcon() {
  return <PhGiftIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function QrCodeIcon() {
  return <PhQrCodeIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function ScannerIcon() {
  return <PhScanIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function ConverterIcon() {
  return <PhCurrencyCircleDollarIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function PercentIcon() {
  return <PhPercentIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function CalculatorIcon() {
  return <PhCalculatorIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function SparkleIcon() {
  return <PhSparkleIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function CardGuidelinesIcon() {
  return <PhIdentificationCardIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function AutoImportIcon() {
  return <PhImagesIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function KeyboardNavIcon() {
  return <PhKeyboardIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
}

function UploadReviewIcon() {
  return <PhClipboardTextIcon weight="fill" aria-hidden="true" className="h-5 w-5" />;
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

// Every section/row the Settings home shows, in display order.
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
      { kind: "panel", icon: <DesignIcon />, labelKey: "settings.design", accent: "green", panel: "design" },
      { kind: "panel", icon: <CalendarIcon />, labelKey: "settings.calendar", accent: "blue", panel: "calendar" },
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
