# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.19.0] - 2026-08-30

### Added
- Encrypted full-data backup export/import (Settings > Backup) — a passphrase-protected file you can download and restore from, encrypted client-side so the passphrase never reaches the server
- Biometric app lock (Settings > App lock) — unlock with Face ID/Touch ID/Windows Hello via WebAuthn, alongside the existing passcode option
- A 4-8 digit passcode as an app-lock alternative, entered on a real numeric keypad (typable with a physical keyboard too) that shows the passcode's real length as fixed dot slots
- A configurable app-lock inactivity timeout, and the timeout is now actually respected across a plain page refresh
- Offline support — a sync queue that lets you keep adding/editing expenses (and wallets, budgets, recurring rules, savings goals, loans) without a connection, with a "Pending changes" screen (Settings) to review and retry anything that failed to sync
- Net settle-up on Friends & Family — a single combined "owes you"/"you owe" figure per friend across splits and loans
- Recurring-transaction suggestions (Settings > Recurring) — a heuristic scan of your past transactions, one tap to turn a repeating one into a recurring rule
- Recurring splits (e.g. monthly rent) that auto-regenerate a real split on schedule
- Push notifications for upcoming loan payment reminders
- A "Refer a friend" page with a QR code, copyable link, and an embeddable widget
- Wallets and payment cards are now one thing — any wallet can optionally take on a payment-card look (network badge, chip, holder name, last 4, expiry), with per-card toggles to show/hide the name, card number, balance, currency, holder name, and expiry on its face
- The wallet detail view now shows a Balance box and a Latest Transactions list, with Edit/Add Money/Share/Archive moved into a "..." menu instead of permanently-visible buttons — deleting a wallet was replaced with reversible Archive (restorable from Settings > Wallets)
- Click-and-hold to drag-reorder wallets and cards, on both mobile and desktop
- Card templates — save any wallet's background/color look as a reusable "premade card" others can pick from a gallery; submissions go through an admin review queue (Settings > Admin > Manage Templates) with the option to force specific display settings (or lock the currency) onto anyone who picks it
- "Scan a card" now accepts SVG uploads directly as the background, keeping vector artwork crisp instead of flattening it into a photo
- JCB, UnionPay, and Apple Pay as wallet card networks, with recolorable badges and a separate color picker for the badge/chip icon versus the card's text
- Settings reorganized into clearer sections (Money, Data & Backup, a new admin-only section), with a colored icon badge on every row

### Changed
- Activities is now the default landing page; the old Dashboard moved to /analytics
- Desktop swipe-to-reveal actions on a transaction row replaced with click-and-hold, matching how touch devices already worked

### Fixed
- Swipe actions and hover buttons overlapping on transaction rows (a translucent hover background was letting the swipe backdrop bleed through)
- Several wallet payment-card layout bugs where the balance/holder row shifted position depending on which display toggles were on
- A modal opened from Settings' desktop two-pane layout could render underneath the page's sticky nav header instead of above it
- Drag-to-reorder on mobile being hijacked by the page's own scroll instead of moving the card

## [0.18.0] - 2026-08-27

### Added
- Global transaction search now also matches category name, not just merchant/notes/tags
- Merchant/payee autocomplete on the transaction form, most-recently-used first
- A duplicate-transaction warning when saving an entry with the same date, amount, and merchant as one already on file — never blocks, just asks "save anyway?"
- A PWA "Add expense" home-screen shortcut (long-press the installed app icon)
- Multiple receipt photos per transaction, with a thumbnail gallery to add/remove them, instead of one photo slot
- Debt/loan tracker (Settings > Loans) — track money lent or borrowed, with an optional manual payoff schedule; the other party can be an existing friend or just a typed name
- Shareable split-bill links — "Copy share link" on any split generates a public, read-only page anyone can view without a Tally account, to see what they owe
- Shared/household wallets — invite a friend to view and add transactions to a wallet you own; they see a pending-invite prompt to accept, and get a "Shared" badge instead of the owner's management controls
- An in-app spending assistant (Settings > Assistant) — ask questions like "how much did I spend on food this month" and get an answer computed from your real transactions, not a guess
- PDF monthly report export (Settings) — income/expense totals, spending by category, and a transaction list for the current month, downloadable as a formatted PDF

## [0.17.1] - 2026-08-26

### Added
- A custom themed scrollbar on desktop (matching the app's colors, thinner than the default OS one) for modals and other scrollable panels
- A prompt to optimize an existing profile picture that's still loading slowly, with one tap to re-save it at a smaller size

### Changed
- New profile pictures are now downscaled automatically before upload so they load faster everywhere they appear (existing pictures are unaffected until re-saved, via the new optimize prompt above)
- Settings > Wallets rows now stack the name/balance and the action buttons (Make default, edit, archive, delete) onto two lines on mobile instead of squeezing everything into one, which was truncating long wallet names down to a couple of characters
- Settings' nav list and its content pane now scroll independently on desktop, instead of sharing one page scroll — scrolling down a long nav list no longer drags the shorter content pane out of view with it
- The pass/membership card editor's live preview now always reflects template fields, layout, and images, instead of only appearing once a code was entered or scanned

### Fixed
- A gold (or other same-colored) EMV chip icon could render as an outline only, with no fill, whenever multiple cards sharing that chip color were on screen at once (e.g. the Wallet page's desktop grid)
- A modal's own scrollbar could render outside its rounded corners on desktop, and the page behind an open modal could keep scrolling and show its native scrollbar past the modal's edge
- Payment cards could look stretched or squeezed depending on which view they were shown in

## [0.17.0] - 2026-08-19

### Added
- Wallet — a new Apple-Wallet-style page (replacing Memberships) combining money accounts, payment cards, passes, and memberships into one stacked view: accounts and cards stack together as bank-card visuals, passes and memberships stack together below as pass visuals, with each card peeking above the next and tapping any of them opening it straight to detail
- Cards — a new payment-card visual (network, cardholder name, expiry, masked number) for keeping card art/details for reference; only ever stores the last 4 digits, never a full card number
- Pass templates — Generic, Store card, Coupon, Event ticket, and Boarding pass, each with its own relevant fields, plus a Guided/Custom-layout dual editor (tap-to-place zone grid) and a visual pass-canvas editor for attaching a logo and banner image to a pass
- 4-tile "Create pass" entry menu (New pass / Scan / Photo gallery / From file) and PDF417/Aztec barcode formats alongside QR/Code128/EAN-13/UPC-A
- A universal color picker on every color selector in the app (categories, wallets, cards, passes, savings goals): the existing palette swatches plus a "Custom" panel with a draggable saturation/value square, a hue slider, an eyedropper (where the browser supports it), and synced Hex/RGB/CMYK fields

### Changed
- Tapping an account or payment card on the Wallet page now opens a read-only detail view with Edit/Delete buttons, instead of jumping straight into the edit form — matching how passes and memberships already worked
- Account management (archive, set default, transfer between wallets) is now reachable from the Wallet page itself via a "Manage accounts" button, in addition to Settings

### Fixed
- A wallet's balance or a payment card's details could get visibly clipped mid-digit/mid-line on narrow phone screens; card visuals now grow to fit their content instead of clipping it
- Pull-to-refresh was missing on the new Wallet page

## [0.16.0] - 2026-08-15

### Added
- Full app translation: 16 languages (English, Mandarin Chinese, Hindi, Spanish, French, Arabic, Bengali, Portuguese, Russian, Urdu, Indonesian, German, Japanese, Vietnamese, Turkish, Thai) selectable in Settings > Language — the nav bar, Settings, transaction forms, Activities, and the sign-in/sign-up/welcome screens are now translated, with right-to-left layout for Arabic and Urdu and a matching font stack so every language renders in a font that fits the app's typography instead of a random system default
- Friends & Family — search other Tally users, send and accept friend requests, mark any friend as family
- Challenges — create a savings-race, spending-limit, or no-spend-days contest with friends or family, either competitive (ranked, amounts private by default) or collaborative (one shared progress bar)
- Split bills — split a bill with friends by "I paid the whole thing" or "track who paid what," evenly or by custom amounts, with an optional confirmation step before a split counts; also available as a checkbox right on the Add transaction form
- Screenshots throughout the in-app Usage Guide and FAQ pages

### Changed
- Desktop gets its own layout instead of a stretched copy of the mobile one: hover-revealed row actions in Activities, a persistent two-pane Settings/Activities layout with content shown beside the list instead of as an overlay, and a wider, more flexible Dashboard widget grid
- Every icon and category emoji in the app redrawn onto one consistent line-icon style, replacing a mix of two icon styles and a 32-emoji category picker
- Add/Edit transaction, transaction details, the Activities list, the Settings hub and its sub-pages, Friends & Family, Recurring, Budgets, Savings goals, and Automatic import redesigned to match the app's colored-badge, grouped-card visual language
- Every Dashboard widget remade with its own layout and color identity instead of a uniform recolor
- Settings and Support pages (Usage Guide, FAQ, etc.) now share the same persistent navigation on desktop
- Settings no longer fetches your entire transaction history on every page load, and several modals/panels now load on demand — page navigation is noticeably faster

### Fixed
- Receipt viewer no longer traps you with no way back when installed as an app (PWA) — it opens in an in-app overlay instead of navigating away
- Android's "Add to Home Screen" now shows Tally's actual icon instead of a generic letter
- Two Challenges bugs: a declined reveal request could never be asked again, and non-accepted invitees showed up ranked on the leaderboard
- Dashboard's week-comparison and balance-history widgets now anchor to real calendar boundaries and reconstruct history correctly
- Gauge widget's needle direction, and the donut chart's "largest segment" label showing the wrong slice
- Wallet trend and transfer-total widgets now account for transfers correctly instead of double- or under-counting them
- A failed currency-conversion request no longer silently produces a wrong net-worth total
- Settings icon no longer looks like the theme toggle's sun/moon icon

## [0.15.0] - 2026-08-11

### Added
- New "Welcome" widget on the Dashboard (shown by default): your profile picture, a greeting, total balance, and Expense/Income/Transfer quick-add buttons in one card — configurable in Customize Dashboard to hide the quick-action buttons or scope the balance to a single wallet instead of all wallets combined
- Profile pictures — upload, change, or remove one from Settings > Account; shown on the new Welcome widget
- Drill-down category navigation in the "Add a widget" picker (Income/Expense/Wallet/Chart/Budget/Goals/Overview), replacing the old filter chips
- A "Quick action button" toggle in Customize Dashboard for the Income, Expenses, Remaining, and Summary widgets — hide the Add income/Add expense/Edit balance button to make the card display-only
- New Income, Expense, and Wallet widget families with their own color identity (emerald, rose, and sky/blue) — stat cards, ranked lists, sparkline charts, and a leaderboard, replacing the old neutral-gray versions
- "Budget" split out as its own widget category, separate from "Goals"

### Changed
- Every Dashboard widget now shares a consistent soft-gradient card style, so newly-redesigned widgets no longer look out of place next to older flat ones
- Income, Expenses, and Remaining cards redesigned with a direction-badge icon and currency pill, and their buttons relabeled to describe what they actually do ("Add income", "Add expense", "Edit balance") instead of bank-style "Withdraw"/"Top up"

### Fixed
- Receipt scanning and voice entry, broken by the `gemini-2.5-flash` model being retired for new API keys and a Gemini schema validation change rejecting an empty-string enum value for wallet
- A profile picture uploaded on one account could appear on another account viewed earlier in the same browser, due to the image endpoint being cached as a shared/public resource instead of per-account
- Settings changes like hiding a widget's quick-action button appeared to save in Customize Dashboard but didn't actually persist or show up on the Dashboard, because the save endpoint's validation silently dropped the new fields

## [0.14.0] - 2026-08-08

### Added
- A splash/welcome screen for signed-out visits, with Sign in / Create account buttons, instead of dropping straight onto the login form
- Tapping a transaction in Activities now opens a read-only detail view (amount, category, date, wallet, tags, notes, receipt) — editing requires tapping its "Edit transaction" button, so a stray tap can no longer put you in edit mode
- A balance card at the top of Activities showing your wallet balance, with Expense/Income/Transfer buttons that filter the list below (and a wallet-scope picker to view one wallet instead of all of them)
- "Default wallet for Activities," in Settings > Wallets — choose which wallet (or "All wallets") the Activities balance card and list are scoped to when the page opens
- Activities' filter bar collapsed into a single filter icon next to the search box; tapping it opens a popup with Category, Tag, Wallet, and Date range (the Type filter moved to the balance card's buttons, to avoid two controls doing the same thing)

### Changed
- Settings > Manage categories redesigned: clearer header, full-width Expense/Income/Transfer tabs, category rows shown as color/icon badge chips, and an explicit Cancel/Confirm step for deleting instead of a single button that silently arms itself
- Sign-in and sign-up redesigned on mobile: a small icon badge instead of a centered hero, fields before the GitHub button, sign-up gained a Confirm password field and a required Terms & Conditions/Privacy Policy checkbox

### Fixed
- Fixed several glass/blur panels (date picker, category picker, the transaction form's sticky footer) rendering flat instead of frosted when opened inside a modal, since they were blurring the modal's own glass instead of the page behind it
- Fixed the Filters popup's date-range calendar being able to render below the visible screen with no way to reach it — it now stays on-screen, flipping above its button when there isn't room below

## [0.13.0] - 2026-08-07

### Added
- "Continue with GitHub" sign-in and sign-up, alongside username/password
- Link (or unlink) a GitHub account from an existing username/password account, in Settings > Account's new "Connected accounts" card; unlinking is blocked if the account has no password set, to avoid a lockout
- Sign-in and sign-up pages redesigned with distinct desktop and mobile layouts — desktop splits into a branded panel plus the form (with a 3-step checklist on sign-up), mobile stays a single card with GitHub sign-in surfaced above the fields
- Manual transaction form redesigned with a hero amount input, category color dots, and a collapsible "More details" section for wallet/tags/notes, plus a dedicated two-column layout on desktop instead of a scaled-down mobile one
- Settings > Account redesigned into distinct cards (Profile, Connected accounts, Password, Sessions, Recent security activity, Danger zone) with click-to-edit rows instead of always-open forms

### Fixed
- Fixed GitHub sign-in failing with "redirect_uri is not associated with this application" when the app was reached via a Vercel deployment alias instead of the canonical domain
- Hid the spinner arrows on number inputs app-wide

## [0.12.0] - 2026-08-05

### Added
- Automatic receipt import from Photos — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut (fully automatic on "Photo Added to Album", or a one-tap Share Sheet variant) or the Android share sheet to log receipts without opening the app; imports are tagged `auto-import` and keep the source photo attached so you can spot-check them
- Installable PWA with offline support — install Tally to your home screen; opening it with no connection shows a graceful offline page instead of an error
- Budget rollover — unused budget carries into the next month for categories with rollover enabled
- Recurring rule "skip next occurrence" — skip a single upcoming occurrence without pausing or deleting the rule
- Real currency conversion for the Dashboard's Remaining total, using the same auto-convert setting as receipt/voice scanning
- CSV export/import now covers budgets, recurring rules, and savings goals, not just transactions
- Email notifications — opt in to an email when a recurring rule auto-logs a transaction or a category goes over budget
- Sign out of all devices, in Settings > Account — revokes every other active session immediately
- Swipe gestures in Activities on mobile — swipe a transaction left or right for quick delete/share

### Changed
- Email notification toggles moved out of their own Budgeting entry into Settings > Permissions, alongside the app's other opt-in access settings, and now explain what's needed to enable them
- Default dashboard widgets updated to full-width Summary, full-width Wallets, Wallet ticker, then Recent transactions (dashboards you've already customized are left as-is)
- Rate limiting added to the login endpoint, and a daily cap added to Gemini-powered receipt/voice scans, to bound abuse and cost exposure

### Fixed
- Fixed an internal server error that could occur right after a deploy while the session-version column was still being created
- Fixed slow navigation and cold starts caused by re-running the full schema migration on every serverless cold start
- Fixed a bug where drag-to-reorder on Customize Dashboard could drop a widget in the wrong position
- Fixed split transactions not being saved atomically — a failure partway through could leave a partial split group behind
- Fixed a bug where interrupting a recurring rule's catch-up run partway through could cause it to double-log transactions on the next run

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
