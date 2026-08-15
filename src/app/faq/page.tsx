import { getUserById } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SettingsSubpageLayout from "@/components/SettingsSubpageLayout";
import FaqAccordion from "@/components/FaqAccordion";
import SupportScreenshot from "@/components/SupportScreenshot";

export const dynamic = "force-dynamic";

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
    a: (
      <>
        <p>
          You can set a default currency in Settings, and optionally enable automatic conversion so scanned or
          spoken amounts in a different currency get converted to your default before you review them.
        </p>
        <SupportScreenshot src="currency.jpg" alt="Settings > Currency panel" />
      </>
    ),
  },
  {
    q: "Can I delete my account, or reset my password if I forget it?",
    keywords: "delete account forgot password reset",
    a: (
      <>
        <p>
          Yes to both. Account deletion is in Settings &gt; Account. If you forget your password, set an email on
          your account first (Settings &gt; Account), then use &quot;Forgot password?&quot; on the login screen to
          get a reset link.
        </p>
        <SupportScreenshot src="account.jpg" alt="Settings > Account panel" />
      </>
    ),
  },
  {
    q: "What else can I track besides individual transactions?",
    keywords: "wallets transfers recurring budgets savings goals",
    a: (
      <>
        <p>
          Multiple wallets (cash, bank, e-wallet) with transfers between them, recurring transactions on a schedule,
          per-category monthly budgets with rollover, and savings goals — all under Settings &gt;
          Budgeting/Wallets.
        </p>
        <SupportScreenshot src="wallets.jpg" alt="Settings > Wallets panel" />
      </>
    ),
  },
  {
    q: "Can Tally add receipts automatically without me opening the app?",
    keywords: "automatic import shortcut share sheet token",
    a: (
      <>
        <p>
          Yes — create a personal access token in Settings &gt; Automatic import, then set up an iOS Shortcut or the
          Android share sheet to send photos straight to Tally. Auto-imported transactions are tagged auto-import
          and keep the source photo attached, so you can double-check anything the automation misread.
        </p>
        <SupportScreenshot src="automatic-import.jpg" alt="Settings > Automatic import panel" />
      </>
    ),
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

export default async function FaqPage() {
  const userId = await getUserId();
  const user = await getUserById(userId);

  return (
    <SettingsSubpageLayout username={user?.username ?? ""} email={user?.email ?? null} title="FAQs">
      <p className="-mt-3 mb-5 text-sm text-ink-soft">Tap a question to expand it, or search to jump straight to one.</p>
      <FaqAccordion faqs={FAQS} />
    </SettingsSubpageLayout>
  );
}
