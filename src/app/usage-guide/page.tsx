import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function UsageGuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
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
            <h3 className="mb-1.5 font-semibold text-foreground">Dashboard</h3>
            <p>
              Shows this month&apos;s income and expenses, your live Remaining balance, and a Categories breakdown
              with a spending trend chart. Tap the pencil icon on Remaining to set a new starting balance. The trend
              chart supports several chart types (Bar, Line, Area, Pie, Radar, Stacked Bar) and a range picker (Today
              through All time) via the dropdowns above it.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Activities</h3>
            <p>
              Your full transaction log. Search by merchant, notes, or tags; filter by type, category, tags, or date
              range; and export the currently filtered list as a CSV. Tap any transaction to view its detail,
              attached receipt image, or to edit/delete it.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-foreground">Settings</h3>
            <p>
              Manage your account (username/password), grant microphone/camera permissions, customize your expense
              and income categories, switch light/dark theme, and set your default currency (with optional automatic
              conversion for scanned or spoken amounts in a different currency).
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
