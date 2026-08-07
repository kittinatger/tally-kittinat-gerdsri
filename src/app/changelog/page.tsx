import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const RELEASES: { version: string; date: string; sections: { heading: string; items: string[] }[] }[] = [
  {
    version: "0.13.0",
    date: "2026-08-07",
    sections: [
      {
        heading: "Added",
        items: [
          "\"Continue with GitHub\" sign-in and sign-up, alongside username/password",
          "Link (or unlink) a GitHub account from an existing username/password account, in Settings > Account's new \"Connected accounts\" card; unlinking is blocked if the account has no password set, to avoid a lockout",
          "Sign-in and sign-up pages redesigned with distinct desktop and mobile layouts — desktop splits into a branded panel plus the form (with a 3-step checklist on sign-up), mobile stays a single card with GitHub sign-in surfaced above the fields",
          "Manual transaction form redesigned with a hero amount input, category color dots, and a collapsible \"More details\" section for wallet/tags/notes, plus a dedicated two-column layout on desktop instead of a scaled-down mobile one",
          "Settings > Account redesigned into distinct cards (Profile, Connected accounts, Password, Sessions, Recent security activity, Danger zone) with click-to-edit rows instead of always-open forms",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Fixed GitHub sign-in failing with \"redirect_uri is not associated with this application\" when the app was reached via a Vercel deployment alias instead of the canonical domain",
          "Hid the spinner arrows on number inputs app-wide",
        ],
      },
    ],
  },
  {
    version: "0.12.0",
    date: "2026-08-05",
    sections: [
      {
        heading: "Added",
        items: [
          "Automatic receipt import from Photos — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut (fully automatic on \"Photo Added to Album\", or a one-tap Share Sheet variant) or the Android share sheet to log receipts without opening the app; imports are tagged auto-import and keep the source photo attached so you can spot-check them",
          "Installable PWA with offline support — install Tally to your home screen; opening it with no connection shows a graceful offline page instead of an error",
          "Budget rollover — unused budget carries into the next month for categories with rollover enabled",
          "Recurring rule \"skip next occurrence\" — skip a single upcoming occurrence without pausing or deleting the rule",
          "Real currency conversion for the Dashboard's Remaining total, using the same auto-convert setting as receipt/voice scanning",
          "CSV export/import now covers budgets, recurring rules, and savings goals, not just transactions",
          "Email notifications — opt in to an email when a recurring rule auto-logs a transaction or a category goes over budget",
          "Sign out of all devices, in Settings > Account — revokes every other active session immediately",
          "Swipe gestures in Activities on mobile — swipe a transaction left or right for quick delete/share",
        ],
      },
      {
        heading: "Changed",
        items: [
          "Email notification toggles moved out of their own Budgeting entry into Settings > Permissions, alongside the app's other opt-in access settings, and now explain what's needed to enable them",
          "Default dashboard widgets updated to full-width Summary, full-width Wallets, Wallet ticker, then Recent transactions (dashboards you've already customized are left as-is)",
          "Rate limiting added to the login endpoint, and a daily cap added to Gemini-powered receipt/voice scans, to bound abuse and cost exposure",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Fixed an internal server error that could occur right after a deploy while the session-version column was still being created",
          "Fixed slow navigation and cold starts caused by re-running the full schema migration on every serverless cold start",
          "Fixed a bug where drag-to-reorder on Customize Dashboard could drop a widget in the wrong position",
          "Fixed split transactions not being saved atomically — a failure partway through could leave a partial split group behind",
          "Fixed a bug where interrupting a recurring rule's catch-up run partway through could cause it to double-log transactions on the next run",
        ],
      },
    ],
  },
  {
    version: "0.11.0",
    date: "2026-08-05",
    sections: [
      {
        heading: "Added",
        items: [
          "8 new dashboard widgets: net worth & wallet ticker cards with sparklines, today/pace pills, a no-spend day tracker, a balance hero card with quick Add Income/Expense buttons, a month-progress stepper, and an under-average spending streak card",
          "Recurring transactions, in the new Settings > Budgeting section — rent, subscriptions, salary logged automatically on a weekly/monthly/yearly schedule; editable, pausable, and reorderable",
          "Budgets, in Settings > Budgeting — a monthly spending limit per category, a Dashboard widget showing progress, and a dismissible alert banner when a category nears or goes over its limit",
          "Savings goals, in Settings > Budgeting — track progress toward something you're saving for, with manual contribute/withdraw and a Dashboard progress widget",
          "CSV export and import of your full transaction history — import accepts common column-name synonyms and infers expense vs. income from the amount's sign when a file has no explicit type column",
          "Split transactions — log one receipt as multiple category lines from Add > Manual entry; shown as a single grouped card in Activities",
          "Bulk select in Activities — delete or add a tag to multiple transactions at once",
          "Category icons — an optional emoji alongside each category's color",
          "Wallet filter in Activities, alongside the existing category/tag/date filters",
          "Attach a receipt photo to a manually-entered transaction after the fact",
          "Duplicate a transaction from the edit screen",
          "Photos permission row in Settings > Permissions, alongside Camera and Microphone",
          "Email-based password reset — set an email in Settings > Account, then use \"Forgot password?\" on the login screen, or \"Send reset link to my email\" right there in Account settings without logging out",
        ],
      },
      {
        heading: "Changed",
        items: [
          "The ticker cards, pills, no-spend tracker, and streak card now use the app's light/dark theme and accent palette instead of fixed colors",
          "Customize dashboard's paintbrush icon now matches the \"Customize dashboard\" icon used in Settings",
        ],
      },
    ],
  },
  {
    version: "0.10.0",
    date: "2026-08-03",
    sections: [
      {
        heading: "Added",
        items: [
          "Voice entry now supports logging multiple transactions in one recording (\"twelve fifty on coffee, then forty on lunch\") — the review screen becomes a queue, same as bulk receipt scanning",
          "Customize dashboard reworked as a live iOS-style editor: a paintbrush/checkmark toolbar over a real preview of your Dashboard, with small overlay badges per tile (remove, resize, configure) instead of an always-expanded control list",
          "The whole dashboard widget catalog rebuilt from scratch — 50 new widgets across 9 new visual forms (progress rings, gauges, sparklines, donut charts, calendar heatmaps, comparison bars, stacked bars, trend arrows, leaderboards), on top of the existing stat card/bar list/bar chart shapes",
          "Income, Expenses, and Remaining are now also individually selectable as standalone clickable widgets, alongside the combined Summary cards widget",
          "The \"Add a widget\" picker now shows a live, scaled-down preview of each widget with your real data instead of just its name",
        ],
      },
      {
        heading: "Changed",
        items: [
          "Wallets widget redesigned as a horizontal scroll of cards with a cash/digital icon; Recent transactions widget redesigned as a connected timeline",
        ],
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-08-02",
    sections: [
      {
        heading: "Added",
        items: [
          "Transfer between wallets, in Settings > Wallets — moves money between two of your own wallets as a linked pair of transactions; doesn't count as income or spending, and deleting either side deletes both",
          "Default wallet, in Settings > Wallets — new/edited transactions fall back to it when you don't choose one",
          "Archive wallet, in Settings > Wallets — hides a wallet from pickers and balance totals without deleting its history; still viewable and reversible",
          "Per-wallet currency label, in Settings > Wallets (display only — amounts aren't converted between currencies)",
          "\"Total balance\" Dashboard widget — sum of every active wallet's balance",
          "Receipt scanning and voice entry now detect which wallet a transaction was paid with/into and pre-select it when confident",
        ],
      },
      {
        heading: "Changed",
        items: [
          "The wallet selector in the transaction form now always shows (previously only with 2+ wallets), and defaults to your default wallet",
        ],
      },
    ],
  },
  {
    version: "0.8.1",
    date: "2026-08-02",
    sections: [
      {
        heading: "Changed",
        items: ["Replaced the icons on the mobile navbar (Dashboard, Activities, Settings) with a new custom SVG icon set"],
      },
    ],
  },
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
          "Working \"Export data\" and \"Manage tags\" in Settings > Records (previously placeholders) — export your full transaction history as CSV, and rename/delete tags across every transaction that has them",
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
          "Receipt scanning and voice entry failing with a raw \"heavy traffic\" error from Gemini — now retries transient overload errors automatically and shows a clear message if one still fails",
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
          "Replaced the edit-balance pencil icon on the Dashboard's \"Remaining\" card",
          "Replaced the \"+ Add\" / \"+ Add category\" text with a plus icon, the receipt-scan camera emoji, the voice-entry microphone icon, the dropdown chevrons, and the date-range calendar icon with a consistent icon set",
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
          "\"Your account\" section in Settings — view your username, change your username (checked for availability before saving), and change your password, both requiring your current password to confirm",
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
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
