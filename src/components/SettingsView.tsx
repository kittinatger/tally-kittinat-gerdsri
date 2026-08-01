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
import SettingsSection from "./SettingsSection";
import SettingsListItem from "./SettingsListItem";

type Panel = "account" | "permissions" | "categories" | "theme" | "currency";

const PANEL_TITLES: Record<Panel, string> = {
  account: "Account",
  permissions: "Permissions",
  categories: "Manage categories",
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

function TrayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 3v11m0 0l-4-4m4 4l4-4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
    </svg>
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
                {(panel === "theme" || panel === "currency") && (
                  <h2 className="mb-5 font-display text-2xl text-foreground">{PANEL_TITLES[panel]}</h2>
                )}

                {panel === "account" && <AccountPanel initialUsername={username} />}
                {panel === "permissions" && <PermissionsSettings />}
                {panel === "categories" && <CategoryManager categories={categories} />}
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
                  <SettingsListItem icon={<HashIcon />} label="Manage tags" badge="Coming soon" />
                  <SettingsListItem icon={<TrayIcon />} label="Export data" badge="Coming soon" />
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
