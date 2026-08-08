import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";

export default function UsageGuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-5 font-display text-2xl text-foreground">Usage Guide</h2>

        <div className="space-y-6 rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Adding a transaction</h3>
            <p>
              Tap <span className="font-semibold text-foreground">Add</span> from the Dashboard or Activities page —
              or tap the Income/Expenses card on the Dashboard to jump straight to Add with that type pre-selected.
              You have three ways to log a transaction:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Manual entry</span> — fill in date, amount, merchant,
                category, tags, and notes yourself.
              </li>
              <li>
                <span className="font-semibold text-foreground">Scan a document</span> — take a photo or upload an
                image of a receipt, payslip, or invoice; Gemini reads the details and pre-fills the form for you to
                review before saving. Select multiple images to batch-scan them one after another.
              </li>
              <li>
                <span className="font-semibold text-foreground">Speak</span> — tap the mic and describe the
                transaction out loud (e.g. &quot;spent 12 dollars on coffee at Starbucks today&quot;); it&apos;s
                transcribed and extracted the same way.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Automatic receipt import</h3>
            <p>
              For receipts you&apos;d rather not scan by hand one at a time: create a personal access token in{" "}
              <span className="font-semibold text-foreground">Settings &gt; Automatic import</span>, then set up an
              iOS Shortcut (fully automatic when a photo lands in a chosen album, or a one-tap Share Sheet variant)
              or the Android share sheet, following the setup steps shown there. Imported transactions are tagged{" "}
              <span className="font-semibold text-foreground">auto-import</span> and keep the original photo
              attached, so you can filter by that tag in Activities to spot-check anything misread.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Wallets</h3>
            <p>
              Track balances across multiple cash/bank/e-wallet pools from{" "}
              <span className="font-semibold text-foreground">Settings &gt; Wallets</span>. Transfer money between
              your own wallets (doesn&apos;t count as income or spending), set a default wallet for new transactions,
              archive ones you no longer use without losing their history, and label each with its own currency.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Recurring transactions, budgets & savings goals</h3>
            <p>
              All under <span className="font-semibold text-foreground">Settings &gt; Budgeting</span>. Recurring
              rules auto-log rent, subscriptions, or salary on a weekly/monthly/yearly schedule — pause, edit, skip a
              single upcoming occurrence, or reorder them. Budgets set a monthly spending limit per category, with an
              optional rollover of unused budget into the next month and a Dashboard alert when you&apos;re near or
              over. Savings goals track progress toward something you&apos;re saving for, with manual
              contribute/withdraw.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Split transactions</h3>
            <p>
              From <span className="font-semibold text-foreground">Add &gt; Manual entry</span>, split one receipt
              across multiple categories in a single entry — it shows up as one grouped card in Activities, with
              each line still individually editable or deletable.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Dashboard</h3>
            <p>
              Fully customizable — tap the paintbrush icon to enter the live editor, then add, remove, resize, or
              reorder any of 50+ widgets (stat cards, trend charts, progress rings, donut charts, heatmaps,
              leaderboards, and more) to build your own layout. Widgets you haven&apos;t customized are updated with
              new sensible defaults over time; once you&apos;ve arranged your own, it&apos;s yours to keep.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Activities</h3>
            <p>
              Your full transaction log. Search by merchant, notes, or tags; filter by type, category, tags, wallet,
              or date range; and export the currently filtered list as a CSV. Tap any transaction to view its
              detail, attached receipt image, or to edit/delete it. Select multiple transactions to bulk-delete or
              bulk-tag them at once, or on mobile, swipe a transaction left or right for quick delete/share.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Settings</h3>
            <p>
              Manage your account (username, password, email, account deletion, sign out of all devices), grant
              microphone/camera/photos permissions and manage email notifications, customize your expense and income
              categories and tags, switch light/dark theme, import/export CSV data, and set your default currency
              (with optional automatic conversion for scanned, spoken, or Dashboard amounts in a different currency).
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Install & use offline</h3>
            <p>
              Tally is an installable app — add it to your home screen from your browser&apos;s share/install menu.
              Once installed, it opens instantly, and if you open it with no connection you&apos;ll see a graceful
              offline page instead of an error (viewing existing data offline isn&apos;t supported yet).
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/settings" className="text-navy hover:underline dark:text-blue-300">
            Back to Settings
          </Link>
        </p>
      </main>
    </div>
  );
}
