# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.11.0] - 2026-08-05

### Added
- 8 new dashboard widgets: net worth & wallet ticker cards with sparklines, today/pace pills, a no-spend day tracker, a balance hero card with quick Add Income/Expense buttons, a month-progress stepper, and an under-average spending streak card
- Recurring transactions, in the new Settings > Budgeting section — rent, subscriptions, salary logged automatically on a weekly/monthly/yearly schedule; editable, pausable, and reorderable
- Budgets, in Settings > Budgeting — a monthly spending limit per category, a Dashboard widget showing progress, and a dismissible alert banner when a category nears or goes over its limit
- Savings goals, in Settings > Budgeting — track progress toward something you're saving for, with manual contribute/withdraw and a Dashboard progress widget
- CSV export and import of your full transaction history — import accepts common column-name synonyms and infers expense vs. income from the amount's sign when a file has no explicit type column
- Split transactions — log one receipt as multiple category lines from Add > Manual entry; shown as a single grouped card in Activities
- Bulk select in Activities — delete or add a tag to multiple transactions at once
- Category icons — an optional emoji alongside each category's color
- Wallet filter in Activities, alongside the existing category/tag/date filters
- Attach a receipt photo to a manually-entered transaction after the fact
- Duplicate a transaction from the edit screen
- Photos permission row in Settings > Permissions, alongside Camera and Microphone
- Email-based password reset — set an email in Settings > Account, then use "Forgot password?" on the login screen, or "Send reset link to my email" right there in Account settings without logging out

### Changed
- The ticker cards, pills, no-spend tracker, and streak card now use the app's light/dark theme and accent palette instead of fixed colors
- Customize dashboard's paintbrush icon now matches the "Customize dashboard" icon used in Settings

## [0.10.0] - 2026-08-03

### Added
- Voice entry now supports logging multiple transactions in one recording ("twelve fifty on coffee, then forty on lunch") — the review screen becomes a queue, same as bulk receipt scanning
- Customize dashboard reworked as a live iOS-style editor: a paintbrush/checkmark toolbar over a real preview of your Dashboard, with small overlay badges per tile (remove, resize, configure) instead of an always-expanded control list
- The whole dashboard widget catalog rebuilt from scratch — 50 new widgets across 9 new visual forms (progress rings, gauges, sparklines, donut charts, calendar heatmaps, comparison bars, stacked bars, trend arrows, leaderboards), on top of the existing stat card/bar list/bar chart shapes
- Income, Expenses, and Remaining are now also individually selectable as standalone clickable widgets, alongside the combined Summary cards widget
- The "Add a widget" picker now shows a live, scaled-down preview of each widget with your real data instead of just its name

### Changed
- Wallets widget redesigned as a horizontal scroll of cards with a cash/digital icon; Recent transactions widget redesigned as a connected timeline

## [0.9.0] - 2026-08-02

### Added
- Transfer between wallets, in Settings > Wallets — moves money between two of your own wallets as a linked pair of transactions; doesn't count as income or spending, and deleting either side deletes both
- Default wallet, in Settings > Wallets — new/edited transactions fall back to it when you don't choose one
- Archive wallet, in Settings > Wallets — hides a wallet from pickers and balance totals without deleting its history; still viewable and reversible
- Per-wallet currency label, in Settings > Wallets (display only — amounts aren't converted between currencies)
- "Total balance" Dashboard widget — sum of every active wallet's balance
- Receipt scanning and voice entry now detect which wallet a transaction was paid with/into and pre-select it when confident

### Changed
- The wallet selector in the transaction form now always shows (previously only with 2+ wallets), and defaults to your default wallet

## [0.8.1] - 2026-08-02

### Changed
- Replaced the icons on the mobile navbar (Dashboard, Activities, Settings) with a new custom SVG icon set

## [0.8.0] - 2026-08-01

### Added
- Multiple wallets — track cash, bank accounts, and e-wallets separately, each with its own balance
- Wallets management in Settings > Records, with add/rename/recolor/delete and a per-wallet starting balance
- Wallet selector on the transaction form once more than one wallet exists
- Calendar settings in Settings > Display: week start day and show/hide week numbers now actually change the date pickers; month-start day, bi-weekly period anchor, default launch view, time zone, and alternate calendar are saved as preferences

## [0.7.0] - 2026-08-01

### Added
- Transfer transaction type for self-transfers and e-wallet top-ups — moves your Remaining balance like an expense/income would, but isn't counted in Income/Expenses totals
- Working "Export data" and "Manage tags" in Settings > Records (previously placeholders) — export your full transaction history as CSV, and rename/delete tags across every transaction that has them
- Delete account, in Settings > Account's new Danger zone — requires ticking an acknowledgement checkbox, typing a confirmation phrase, and your current password
- Replaced the dropdown chevron icon across all dropdowns with a consistent style

### Changed
- Sign out moved from the nav header into Settings > Account, alongside the new delete-account option

## [0.6.0] - 2026-08-01

### Added
- Selectable chart type for the Dashboard's spending trend — Bar, Line, Area, Pie, Radar, or Stacked Bar (by category)
- More date range options for the Dashboard's category breakdown: Today, 2/3/6 months, and Year, alongside the existing This month / All time
- Settings reorganized into a navigable list (App settings, Records, Display, Support) with dedicated detail pages instead of one long scrolling page
- Support section in Settings: Usage guide, FAQs, Contact, Report an issue, and Changelog pages
- Custom date picker and category dropdown in the transaction form, replacing the OS-native date input and select

### Fixed
- Receipt scanning and voice entry failing with a raw "heavy traffic" error from Gemini — now retries transient overload errors automatically and shows a clear message if one still fails
- Replaced remaining emoji and system symbols (search icon, close buttons) with a consistent icon set
- Sign-out confirmation button is now red to signal it's a destructive action

## [0.5.0] - 2026-07-31

### Added
- Tapping the Income or Expenses summary card on the Dashboard opens Add with that transaction type preset
- Direct camera capture for receipt scanning — some mobile browsers (Samsung Internet in particular) only offered gallery upload, not a direct camera option
- Confirmation prompt before signing out
- Permissions section in Settings to check and request microphone/camera access up front

### Changed
- Replaced the edit-balance pencil icon on the Dashboard's "Remaining" card
- Replaced the "+ Add" / "+ Add category" text with a plus icon, the receipt-scan camera emoji, the voice-entry microphone icon, the dropdown chevrons, and the date-range calendar icon with a consistent icon set

## [0.4.1] - 2026-07-31

### Changed
- Replaced favicons with new light/dark SVG marks, and swapped the login/register/header logo badge to match
- Replaced the theme toggle, sign-out, chart, and receipt icons with a new icon set
- Consolidated author, tech stack, and icon-licensing credits into `.github/ACKNOWLEDGMENTS.md`
- Updated README screenshots

### Fixed
- Navigating between Dashboard, Activities, and Settings could feel slow with no feedback while data loaded — added streaming loading skeletons so the transition shows instantly, plus a database index to keep the transaction list query fast as history grows
- Corrected the contact email in the security policy, contributing guide, and code of conduct

## [0.4.0] - 2026-07-30

### Added
- "Your account" section in Settings — view your username, change your username (checked for availability before saving), and change your password, both requiring your current password to confirm

## [0.3.0] - 2026-07-30

### Changed
- Reorganized the app into three pages: **Dashboard** (income/expense summary, remaining balance, category breakdown, spending trend), **Activities** (full transaction log, search/filter, CSV export, add transaction), and **Settings** (theme, currency, auto-convert, category management)
- Settings moved from a gear-icon dropdown into its own page for authenticated users (the dropdown is still used for the pre-login theme/currency preview on the login/register pages)
- Category management (add/rename/delete) moved from the old Categories page into Settings
- `/categories` now redirects to the Dashboard

### Added
- Version number, Privacy Policy, and Terms of Service links in the Settings page footer

## [0.2.0] - 2026-07-30

### Added
- Multi-user accounts: public sign-up at `/register` (username + password, no email) so multiple people can use the same deployment with fully isolated data
- One-time admin bootstrap (`ADMIN_USERNAME`/`ADMIN_BOOTSTRAP_PASSWORD`) that migrates a pre-existing single-user deployment's data to a real account instead of losing it

### Changed
- Session cookies now identify which account is logged in, instead of just being a shared pass/fail token
- Replaced the single shared `APP_PASSWORD` with per-account passwords (scrypt-hashed)

### Fixed
- Closed an IDOR gap where expense/category edit and delete endpoints only checked the row's id, not who owned it
- Fixed a migration bug that could delete the settings row (starting balance, currency) before an admin account claimed it
- Fixed a crash/collision in new-account creation caused by a leftover legacy default value on the settings table

### Security
- Passwords are now hashed (scrypt) instead of compared against a single plaintext environment variable
- Login no longer reveals whether a given username exists via response timing

## [0.1.0] - 2026-07-28

### Added
- Core expense tracking with manual entry
- Receipt scanning with Google Gemini vision API
  - Auto-extracts merchant, total, date, category
  - Bulk receipt upload and batch processing
  - Original receipt image storage
- Voice-to-expense with transcription
- Search and filtering by merchant, notes, category, type, tags, date range
- Free-form transaction tagging
- Income and expense transaction types with separate category lists
- Customizable category names and colors
- 6-month spending trend chart
- CSV export of filtered transactions
- Live-updating balance calculator
- Multi-currency support with auto-conversion
  - Currency selection in settings
  - Automatic conversion for scanned/voiced transactions (via Frankfurter API)
- Password-protected single-user design with signed session cookies
- Responsive liquid-glass UI optimized for mobile and desktop
- Pull-to-refresh on mobile
- Postgres backend with Vercel Postgres integration
- Vercel one-click deploy button
- Public release documentation (security policy, contribution guidelines, code of conduct)
- Step-by-step Vercel deployment guide for non-technical users
- Screenshots and issue templates

### Tech Stack
- Next.js 16.2 (App Router) with TypeScript
- React 19 with functional components
- Tailwind CSS v4 for styling
- Vercel Postgres (Neon) for storage
- Google Gemini API for vision and transcription
- Frankfurter API for currency conversion

### Security
- Fixed critical API authentication vulnerability — all API routes now require a valid session token via middleware

---

## How to version going forward

When releasing a new version:

1. Add a new section with the version number and date
2. List changes under: Added, Changed, Deprecated, Removed, Fixed, Security
3. Update the `[Unreleased]` section as you work
4. Tag the commit: `git tag -a v0.2.0 -m "Version 0.2.0"`
5. Push tags: `git push origin --tags`

Example format:
```markdown
## [0.2.0] - 2025-02-01

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Breaking change description
```
