"use client";

import Link from "next/link";
import type { CategoryOption } from "@/types/category";
import { CurrencyProvider } from "@/lib/currency-context";
import { APP_VERSION } from "@/lib/version";
import PullToRefresh from "./PullToRefresh";
import AppHeader from "./AppHeader";
import SettingsPanel from "./SettingsPanel";
import CategoryManager from "./CategoryManager";

export default function SettingsView({ categories, currency }: { categories: CategoryOption[]; currency: string }) {
  return (
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
        <PullToRefresh>
          <AppHeader />

          <main className="flex-1 px-1 py-6 sm:px-2">
            <h2 className="mb-5 font-display text-2xl text-foreground">Settings</h2>

            <div className="mb-8 rounded-card border border-line bg-surface p-5">
              <SettingsPanel />
            </div>

            <CategoryManager categories={categories} />

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
