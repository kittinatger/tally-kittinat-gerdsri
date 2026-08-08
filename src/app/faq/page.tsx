import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";
import FaqAccordion from "@/components/FaqAccordion";

const FAQS: { q: string; a: React.ReactNode; keywords?: string }[] = [
  {
    q: "Do I need to deploy anything to use Tally?",
    keywords: "deploy self-host hosting",
    a: (
      <>
        No — go to{" "}
        <a
          href="https://tally-kittinat.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="text-navy underline hover:no-underline dark:text-blue-300"
        >
          tally-kittinat.vercel.app
        </a>{" "}
        and create your own account. It&apos;s free and your data is private to your account.
      </>
    ),
  },
  {
    q: "Can other people on the same deployment see my data?",
    keywords: "privacy isolated multi-user",
    a: "No. Every account's expenses, categories, and balance are fully isolated from every other account — no one else can see or modify them.",
  },
  {
    q: "Do I need a Gemini API key to use receipt scanning or voice entry?",
    keywords: "gemini api key scan voice",
    a: "Only if you're self-hosting your own instance. On the shared live deployment, scanning and voice entry work out of the box. Manual entry and CSV export never require a key.",
  },
  {
    q: "What happens to my receipt photos and voice recordings?",
    keywords: "privacy photos recordings gemini",
    a: "Receipt images and voice recordings are sent to Google Gemini to extract the transaction details, then the receipt image is stored with your transaction so you can view it later. See the Privacy Policy for the full breakdown.",
  },
  {
    q: "Can I change my default currency, or track amounts in more than one currency?",
    keywords: "currency conversion multi-currency",
    a: "You can set a default currency in Settings, and optionally enable automatic conversion so scanned or spoken amounts in a different currency get converted to your default before you review them.",
  },
  {
    q: "Can I delete my account, or reset my password if I forget it?",
    keywords: "delete account forgot password reset",
    a: 'Yes to both. Account deletion is in Settings > Account. If you forget your password, set an email on your account first (Settings > Account), then use "Forgot password?" on the login screen to get a reset link.',
  },
  {
    q: "What else can I track besides individual transactions?",
    keywords: "wallets transfers recurring budgets savings goals",
    a: "Multiple wallets (cash, bank, e-wallet) with transfers between them, recurring transactions on a schedule, per-category monthly budgets with rollover, and savings goals — all under Settings > Budgeting/Wallets.",
  },
  {
    q: "Can Tally add receipts automatically without me opening the app?",
    keywords: "automatic import shortcut share sheet token",
    a: "Yes — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut or the Android share sheet to send photos straight to Tally. Auto-imported transactions are tagged auto-import and keep the source photo attached, so you can double-check anything the automation misread.",
  },
  {
    q: "Is Tally free and open source?",
    keywords: "license mit github open source",
    a: (
      <>
        Yes, released under the MIT License. The full source is on{" "}
        <a
          href="https://github.com/kittinatger/tally-kittinat-gerdsri"
          target="_blank"
          rel="noreferrer"
          className="text-navy underline hover:no-underline dark:text-blue-300"
        >
          GitHub
        </a>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-1 font-display text-2xl text-foreground">FAQs</h2>
        <p className="mb-5 text-sm text-ink-soft">Tap a question to expand it, or search to jump straight to one.</p>

        <FaqAccordion faqs={FAQS} />

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/settings" className="text-navy hover:underline dark:text-blue-300">
            Back to Settings
          </Link>
        </p>
      </main>
    </div>
  );
}
