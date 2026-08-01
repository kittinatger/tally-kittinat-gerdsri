"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryOption } from "@/types/category";
import { CurrencyProvider } from "@/lib/currency-context";
import { APP_VERSION } from "@/lib/version";
import PullToRefresh from "./PullToRefresh";
import AppHeader from "./AppHeader";
import AccountPanel from "./AccountPanel";
import ThemeSetting from "./ThemeSetting";
import CurrencySettings from "./CurrencySettings";
import PermissionsSettings from "./PermissionsSettings";
import CategoryManager from "./CategoryManager";
import TagManager from "./TagManager";
import ExportDataButton from "./ExportDataButton";
import SettingsSection from "./SettingsSection";
import SettingsListItem from "./SettingsListItem";

type Panel = "account" | "permissions" | "categories" | "tags" | "theme" | "currency";

const PANEL_TITLES: Record<Panel, string> = {
  account: "Account",
  permissions: "Permissions",
  categories: "Manage categories",
  tags: "Manage tags",
  theme: "Theme",
  currency: "Currency",
};

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 3l7 3v5.5c0 5-3.2 8.4-7 9.5-3.8-1.1-7-4.5-7-9.5V6l7-3z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9 3L7 21M17 3l-2 18M4 9h16M3 15h16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

function SunMoonIcon() {
  return (
    <>
      <svg viewBox="0 0 27.4805 27.1973" fill="currentColor" className="h-5 w-5 dark:hidden">
        <path d="M13.5547 4.69727C14.0723 4.69727 14.4824 4.27734 14.4824 3.76953L14.4824 0.927734C14.4824 0.419922 14.0723 0 13.5547 0C13.0469 0 12.6367 0.419922 12.6367 0.927734L12.6367 3.76953C12.6367 4.27734 13.0469 4.69727 13.5547 4.69727ZM19.834 7.31445C20.1953 7.66602 20.7812 7.68555 21.1523 7.31445L23.1641 5.30273C23.5254 4.94141 23.5156 4.3457 23.1641 3.98438C22.8027 3.63281 22.2168 3.62305 21.8555 3.98438L19.834 6.00586C19.4727 6.36719 19.4824 6.95312 19.834 7.31445ZM22.4316 13.5938C22.4316 14.1016 22.8516 14.5117 23.3594 14.5117L26.1914 14.5117C26.6992 14.5117 27.1191 14.1016 27.1191 13.5938C27.1191 13.0859 26.6992 12.666 26.1914 12.666L23.3594 12.666C22.8516 12.666 22.4316 13.0859 22.4316 13.5938ZM19.834 19.873C19.4824 20.2344 19.4727 20.8301 19.834 21.1816L21.8555 23.2031C22.2168 23.5645 22.8027 23.5449 23.1641 23.1934C23.5156 22.832 23.5254 22.2461 23.1641 21.8945L21.1426 19.873C20.7812 19.5215 20.1953 19.5215 19.834 19.873ZM13.5547 22.4902C13.0469 22.4902 12.6367 22.9004 12.6367 23.4082L12.6367 26.25C12.6367 26.7676 13.0469 27.1777 13.5547 27.1777C14.0723 27.1777 14.4824 26.7676 14.4824 26.25L14.4824 23.4082C14.4824 22.9004 14.0723 22.4902 13.5547 22.4902ZM7.28516 19.873C6.92383 19.5215 6.32812 19.5215 5.9668 19.873L3.95508 21.8848C3.59375 22.2363 3.60352 22.8223 3.94531 23.1836C4.30664 23.5352 4.90234 23.5547 5.25391 23.1934L7.27539 21.1816C7.62695 20.8301 7.62695 20.2344 7.28516 19.873ZM4.67773 13.5938C4.67773 13.0859 4.26758 12.666 3.75977 12.666L0.927734 12.666C0.419922 12.666 0 13.0859 0 13.5938C0 14.1016 0.419922 14.5117 0.927734 14.5117L3.75977 14.5117C4.26758 14.5117 4.67773 14.1016 4.67773 13.5938ZM7.27539 7.31445C7.62695 6.96289 7.62695 6.35742 7.28516 6.00586L5.26367 3.98438C4.92188 3.64258 4.32617 3.63281 3.96484 3.98438C3.61328 4.3457 3.60352 4.94141 3.95508 5.29297L5.9668 7.31445C6.32812 7.67578 6.91406 7.66602 7.27539 7.31445Z" />
        <path d="M13.5449 19.873C17.0117 19.873 19.834 17.0605 19.834 13.5938C19.834 10.127 17.0117 7.30469 13.5449 7.30469C10.0781 7.30469 7.26562 10.127 7.26562 13.5938C7.26562 17.0605 10.0781 19.873 13.5449 19.873Z" />
      </svg>
      <svg viewBox="0 0 25.4297 25.3088" fill="currentColor" className="hidden h-5 w-5 dark:block">
        <path d="M13.0859 25.2277C18.5254 25.2277 22.9883 21.9464 24.9414 17.6691C25.3027 16.9171 24.834 16.38 24.0918 16.6241C23.1836 16.9464 21.6113 17.3077 20.0488 17.3077C12.4414 17.3077 8.11523 12.9816 8.11523 5.37414C8.11523 3.8507 8.4375 2.30773 8.93555 1.0675C9.25781 0.256952 8.70117-0.23133 7.91992 0.110467C3.69141 1.90734 0 6.38976 0 12.132C0 19.3585 5.86914 25.2277 13.0859 25.2277Z" />
      </svg>
    </>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M15.2 9c0-1.4-1.4-2.5-3.2-2.5S8.8 7.6 8.8 9s1.4 2 3.2 2.5 3.2 1.1 3.2 2.5-1.4 2.5-3.2 2.5-3.2-1.1-3.2-2.5" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.8 5.6 3.8 9s-1.4 6.5-3.8 9c-2.4-2.5-3.8-5.6-3.8-9s1.4-6.5 3.8-9z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13z" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2c.3-1.4 1.5-2.2 2.9-2.2 1.6 0 2.9 1 2.9 2.4 0 1.6-1.6 2-2.6 2.9-.4.4-.6.8-.6 1.4" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7l7.5 6 7.5-6" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 21V4" />
      <path d="M5 4.5c1.6-1 3.4-1 5 0s3.4 1 5 0v8c-1.6 1-3.4 1-5 0s-3.4-1-5 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
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
}: {
  categories: CategoryOption[];
  currency: string;
  username: string;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);

  return (
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
        <PullToRefresh>
          <AppHeader />

          <main className="flex-1 px-1 py-6 sm:px-2">
            {panel ? (
              <div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-foreground"
                >
                  <BackIcon />
                  Settings
                </button>
                {(panel === "theme" || panel === "currency" || panel === "tags") && (
                  <h2 className="mb-5 font-display text-2xl text-foreground">{PANEL_TITLES[panel]}</h2>
                )}

                {panel === "account" && <AccountPanel initialUsername={username} />}
                {panel === "permissions" && <PermissionsSettings />}
                {panel === "categories" && <CategoryManager categories={categories} />}
                {panel === "tags" && <TagManager />}
                {panel === "theme" && <ThemeSetting />}
                {panel === "currency" && <CurrencySettings />}
              </div>
            ) : (
              <div>
                <h2 className="mb-5 font-display text-2xl text-foreground">Settings</h2>

                <SettingsSection title="App settings">
                  <SettingsListItem icon={<AccountIcon />} label="Account" onClick={() => setPanel("account")} />
                  <SettingsListItem icon={<ShieldIcon />} label="Permissions" onClick={() => setPanel("permissions")} />
                </SettingsSection>

                <SettingsSection title="Records">
                  <SettingsListItem icon={<GridIcon />} label="Manage categories" onClick={() => setPanel("categories")} />
                  <SettingsListItem icon={<HashIcon />} label="Manage tags" onClick={() => setPanel("tags")} />
                  <ExportDataButton />
                </SettingsSection>

                <SettingsSection title="Display">
                  <SettingsListItem icon={<CalendarIcon />} label="Calendar settings" badge="Coming soon" />
                  <SettingsListItem icon={<SunMoonIcon />} label="Theme" onClick={() => setPanel("theme")} />
                  <SettingsListItem icon={<CoinIcon />} label="Currency" onClick={() => setPanel("currency")} />
                  <SettingsListItem icon={<GlobeIcon />} label="Language" badge="Coming soon" />
                </SettingsSection>

                <SettingsSection title="Support">
                  <SettingsListItem icon={<BookIcon />} label="Usage guide" href="/usage-guide" />
                  <SettingsListItem icon={<QuestionIcon />} label="FAQs" href="/faq" />
                  <SettingsListItem icon={<MailIcon />} label="Contact" href="/contact" />
                  <SettingsListItem icon={<FlagIcon />} label="Report an issue" href="/report-issue" />
                  <SettingsListItem icon={<ClockIcon />} label="Changelog" href="/changelog" />
                </SettingsSection>
              </div>
            )}

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
  );
}
