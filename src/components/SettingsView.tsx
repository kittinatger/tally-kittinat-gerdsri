"use client";

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
import ComingSoonRow from "./ComingSoonRow";

export default function SettingsView({
  categories,
  currency,
  username,
}: {
  categories: CategoryOption[];
  currency: string;
  username: string;
}) {
  return (
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
        <PullToRefresh>
          <AppHeader />

          <main className="flex-1 px-1 py-6 sm:px-2">
            <h2 className="mb-5 font-display text-2xl text-foreground">Settings</h2>

            <SettingsSection title="App settings">
              <AccountPanel initialUsername={username} />
              <PermissionsSettings />
            </SettingsSection>

            <SettingsSection title="Records">
              <CategoryManager categories={categories} />
              <ComingSoonRow label="Manage tags" description="Rename or delete existing tags." />
              <ComingSoonRow label="Export data" description="Download your transactions as a file." />
            </SettingsSection>

            <SettingsSection title="Display">
              <ComingSoonRow label="Calendar settings" description="Choose your week start day and date format." />
              <ThemeSetting />
              <CurrencySettings />
              <ComingSoonRow label="Language" />
            </SettingsSection>

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
