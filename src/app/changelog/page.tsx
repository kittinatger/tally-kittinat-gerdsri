import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const RELEASES: { version: string; date: string; sections: { heading: string; items: string[] }[] }[] = [
  {
    version: "0.8.0",
    date: "2026-08-01",
    sections: [
      {
        heading: "Added",
        items: [
          "Multiple wallets — track cash, bank accounts, and e-wallets separately, each with its own balance",
          "Wallets management in Settings > Records, with add/rename/recolor/delete and a per-wallet starting balance",
          "Wallet selector on the transaction form once more than one wallet exists",
          "Calendar settings in Settings > Display: week start day and show/hide week numbers now actually change the date pickers; month-start day, bi-weekly period anchor, default launch view, time zone, and alternate calendar are saved as preferences",
        ],
      },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-08-01",
    sections: [
      {
        heading: "Added",
        items: [
          "Transfer transaction type for self-transfers and e-wallet top-ups — moves your Remaining balance like an expense/income would, but isn't counted in Income/Expenses totals",
          "Working “Export data” and “Manage tags” in Settings > Records (previously placeholders) — export your full transaction history as CSV, and rename/delete tags across every transaction that has them",
          "Delete account, in Settings > Account's new Danger zone — requires ticking an acknowledgement checkbox, typing a confirmation phrase, and your current password",
          "Replaced the dropdown chevron icon across all dropdowns with a consistent style",
        ],
      },
      {
        heading: "Changed",
        items: ["Sign out moved from the nav header into Settings > Account, alongside the new delete-account option"],
      },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-08-01",
    sections: [
      {
        heading: "Added",
        items: [
          "Selectable chart type for the Dashboard's spending trend — Bar, Line, Area, Pie, Radar, or Stacked Bar (by category)",
          "More date range options for the Dashboard's category breakdown: Today, 2/3/6 months, and Year, alongside the existing This month / All time",
          "Settings reorganized into a navigable list (App settings, Records, Display, Support) with dedicated detail pages instead of one long scrolling page",
          "Support section in Settings: Usage guide, FAQs, Contact, Report an issue, and Changelog pages",
          "Custom date picker and category dropdown in the transaction form, replacing the OS-native date input and select",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Receipt scanning and voice entry failing with a raw “heavy traffic” error from Gemini — now retries transient overload errors automatically and shows a clear message if one still fails",
          "Replaced remaining emoji and system symbols (search icon, close buttons) with a consistent icon set",
          "Sign-out confirmation button is now red to signal it's a destructive action",
        ],
      },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-07-31",
    sections: [
      {
        heading: "Added",
        items: [
          "Tapping the Income or Expenses summary card on the Dashboard opens Add with that transaction type preset",
          "Direct camera capture for receipt scanning — some mobile browsers (Samsung Internet in particular) only offered gallery upload, not a direct camera option",
          "Confirmation prompt before signing out",
          "Permissions section in Settings to check and request microphone/camera access up front",
        ],
      },
      {
        heading: "Changed",
        items: [
          "Replaced the edit-balance pencil icon on the Dashboard's “Remaining” card",
          "Replaced the “+ Add” / “+ Add category” text with a plus icon, the receipt-scan camera emoji, the voice-entry microphone icon, the dropdown chevrons, and the date-range calendar icon with a consistent icon set",
        ],
      },
    ],
  },
  {
    version: "0.4.1",
    date: "2026-07-31",
    sections: [
      {
        heading: "Changed",
        items: [
          "Replaced favicons with new light/dark SVG marks, and swapped the login/register/header logo badge to match",
          "Replaced the theme toggle, sign-out, chart, and receipt icons with a new icon set",
          "Consolidated author, tech stack, and icon-licensing credits into .github/ACKNOWLEDGMENTS.md",
          "Updated README screenshots",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Navigating between Dashboard, Activities, and Settings could feel slow with no feedback while data loaded — added streaming loading skeletons so the transition shows instantly, plus a database index to keep the transaction list query fast as history grows",
          "Corrected the contact email in the security policy, contributing guide, and code of conduct",
        ],
      },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-30",
    sections: [
      {
        heading: "Added",
        items: [
          "“Your account” section in Settings — view your username, change your username (checked for availability before saving), and change your password, both requiring your current password to confirm",
        ],
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-30",
    sections: [
      {
        heading: "Changed",
        items: [
          "Reorganized the app into three pages: Dashboard, Activities, and Settings",
          "Settings moved from a gear-icon dropdown into its own page for authenticated users",
          "Category management moved from the old Categories page into Settings",
        ],
      },
      {
        heading: "Added",
        items: ["Version number, Privacy Policy, and Terms of Service links in the Settings page footer"],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-30",
    sections: [
      {
        heading: "Added",
        items: [
          "Multi-user accounts: public sign-up at /register so multiple people can use the same deployment with fully isolated data",
          "One-time admin bootstrap that migrates a pre-existing single-user deployment's data to a real account",
        ],
      },
      {
        heading: "Security",
        items: [
          "Passwords are now hashed (scrypt) instead of compared against a single plaintext environment variable",
          "Login no longer reveals whether a given username exists via response timing",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-28",
    sections: [
      {
        heading: "Added",
        items: [
          "Core expense tracking with manual entry",
          "Receipt scanning with Google Gemini vision API",
          "Voice-to-expense with transcription",
          "Search, filtering, tagging, and CSV export",
          "Multi-currency support with auto-conversion",
          "Password-protected design with signed session cookies",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-10 pt-3 sm:px-4">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <h2 className="mb-2 font-display text-2xl text-foreground">Changelog</h2>
        <p className="mb-5 text-sm text-ink-soft">
          Full history on{" "}
          <a
            href="https://github.com/kittinatger/tally-kittinat-gerdsri/blob/master/CHANGELOG.md"
            target="_blank"
            rel="noreferrer"
            className="text-navy underline hover:no-underline dark:text-blue-300"
          >
            GitHub
          </a>
          .
        </p>

        <div className="space-y-6">
          {RELEASES.map((release) => (
            <div key={release.version} className="rounded-card border border-line bg-surface p-5">
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="font-display text-lg text-foreground">v{release.version}</h3>
                <span className="text-xs text-ink-soft">{release.date}</span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
                {release.sections.map((section) => (
                  <div key={section.heading}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {section.heading}
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
