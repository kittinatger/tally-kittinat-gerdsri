# Tally — Personal Expense Tracker

Tally is a personal project designed to make expense tracking simple and private. Add expenses manually, snap a photo of a
receipt, or just describe it out loud. [Create an account](https://tally-kittinat.vercel.app) to use it.

## Features

- **Manual entry, receipt scanning & voice entry** — enter expenses/income manually (date, amount, merchant, category, notes), snap a photo of a receipt, or tap the mic and describe it out loud; [Google Gemini](https://ai.google.dev/) extracts the fields and pre-fills the form for you to review. Drop multiple receipt photos at once to batch-scan them.
- **Automatic receipt import from Photos** — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut (fully automatic, or a one-tap Share Sheet variant) or the Android share sheet to log receipts without ever opening the app; auto-imported transactions are tagged `auto-import` and keep the source photo attached so you can spot-check them.
- **Wallets** — track balances across multiple cash/bank/e-wallet pools, transfer between them (with real currency conversion), set a default, archive old ones, share one with a friend, and give any wallet a payment-card look (network badge, chip, holder name, last 4, expiry) with per-field show/hide toggles and a drag-to-reorder stack.
- **Wallet passes & membership cards** — digital loyalty cards, coupons, event tickets, boarding passes, gift cards, and transit passes with a QR/barcode/PDF417/Aztec code, custom-named fields, and an attachable logo/banner (with a pan-pinch-zoom crop tool); pick a look from a gallery of admin-reviewed premade pass designs, or submit your own.
- **Folders** — group wallets/cards and passes into named, colored folders on the Wallet page (two independent groupings — a card folder and a pass folder are never mixed).
- **Recurring transactions** — rent, subscriptions, salary logged automatically on a weekly/monthly/yearly schedule; editable, pausable, reorderable, and skippable for a single upcoming occurrence.
- **Budgets** — a monthly spending limit per category, an Analytics progress section, optional rollover of unused budget into the next month, and a dismissible alert banner when a category nears or goes over its limit.
- **Savings goals** — track progress toward something you're saving for, with manual contribute/withdraw and an Analytics progress section.
- **Debt & loan tracker** — track money lent or borrowed, with an optional manual payoff schedule and push/in-app notifications for upcoming payments.
- **Split transactions** — log one receipt as multiple category lines (shown as a single grouped card in Activities), or share a public, read-only link so anyone can see what they owe without a Tally account.
- **A rich, customizable Analytics page** — spending trends, category breakdowns, net worth & wallet trends, budget/goal health, and forward-looking end-of-month projections, plus a merchant spend leaderboard, spending-by-day-of-week, biggest single transactions, a savings-rate stat, and a category-movers list showing what changed since the last period — all driven by one shared period selector (This month / Last month / Last 3 months / Last 6 months / Year to date), with a "Customize" menu to show/hide any individual section.
- **In-app notification center & desktop command palette** — a bell icon surfaces recurring/budget/loan alerts as they happen (regardless of your email/push settings); on desktop, press `Ctrl`/`Cmd`+`K` for a fuzzy-searchable command palette, or use global shortcuts (`G` then a letter to jump between pages, `C` to add a transaction, `?` to see the full list — also browsable at Settings > Keyboard shortcuts).
- **In-app AI assistant & tools** — ask the spending assistant questions like "how much did I spend on food this month" and get an answer computed from your real transactions; plus a standalone QR/barcode code generator and scanner, currency converter, and discount/tip and loan calculators (Settings > Tools).
- **Search, filter & bulk actions** — search by merchant/notes/tags; filter by type, category, tags, wallet, or date range; bulk-select transactions in Activities to delete or tag them at once; swipe a transaction left/right on mobile for quick delete/share.
- **Free-form tags, customizable categories & a vendor directory** — label transactions with custom tags, rename/recolor/add an icon to categories, and manage every merchant you've ever paid (Settings > Vendors) — sortable by spend/recency/usage, with one-tap merge for inconsistently-spelled entries.
- **CSV export & import** — for transactions, budgets, recurring rules, and savings goals; import accepts common column-name synonyms and infers expense vs. income from the amount's sign.
- **Currency selection & automatic conversion** — pick your default currency in Settings; optionally auto-convert amounts detected in a different currency (via [Frankfurter](https://frankfurter.app), a free ECB-rate API) when scanning, speaking, or viewing Analytics.
- **Installable, offline-capable PWA** — install Tally to your home screen; it works offline with a sync queue for anything you add or edit without a connection, and can be locked behind a passcode or Face ID/Touch ID/Windows Hello.
- **Email & in-app notifications** — opt in (Settings > Permissions) to an email when a recurring rule auto-logs a transaction or a category goes over budget; the in-app notification center picks up the same events (plus loan reminders) regardless of that opt-in.
- **Encrypted backup** — a passphrase-protected full-data export/import (Settings > Backup), encrypted client-side so the passphrase never reaches the server.
- **Multi-user accounts, fully isolated** — anyone can sign up with their own username and password, or sign in with GitHub (and link/unlink GitHub from an existing account in Settings > Account); each account's data is fully private via signed, httpOnly session cookies. Self-service password reset by email, account deletion, and "sign out of all devices" are all available from Settings.
- **Liquid-glass UI** — clean, modern design built for quick entry on a phone and full desktop use, with 24 selectable nav-bar styles and 6 selectable Settings page layouts.
- **Postgres storage** — works out of the box with [Vercel's Neon database](https://vercel.com/docs/storage/vercel-postgres) (free tier available).

## Screenshots

> The Dashboard screenshots that used to open this section showed a widget-grid
> page that has since been replaced by the fixed [Analytics](#features) page
> (see the [changelog](CHANGELOG.md)) — they've been removed rather than left
> up as an inaccurate first impression. The galleries below (Activities,
> Settings) still reflect the current app; [try the live demo](https://tally-kittinat.vercel.app)
> for a look at Analytics, Wallet folders, and everything else added since.

**Adding a transaction** — manual entry, receipt scanning, or voice entry, all from the same modal.

<table>
<tr>
<td><img src="screenshots/06-add-expense-manual-desktop.jpg" alt="Add transaction, manual entry" width="300"/></td>
<td><img src="screenshots/07-add-expense-scan-desktop.jpg" alt="Add transaction, scan a receipt" width="300"/></td>
<td><img src="screenshots/08-add-expense-voice-desktop.jpg" alt="Add transaction, speak it" width="300"/></td>
</tr>
<tr>
<td><img src="screenshots/11-add-expense-manual-mobile.jpg" alt="Add transaction on mobile" width="200"/></td>
</tr>
</table>

**Activities** — search, filter, and manage every transaction; desktop gets a two-pane master-detail layout, mobile keeps a focused full-width list with swipe actions.

<table>
<tr>
<td><img src="screenshots/12-activities-desktop-dark.jpg" alt="Activities, desktop, dark mode" width="360"/></td>
<td><img src="screenshots/13-activities-detail-desktop-dark.jpg" alt="Activities with transaction detail open, desktop" width="360"/></td>
</tr>
<tr>
<td><img src="screenshots/14-activities-desktop-light.jpg" alt="Activities, desktop, light mode" width="360"/></td>
<td><img src="screenshots/15-activities-mobile-dark.jpg" alt="Activities, mobile, dark mode" width="180"/></td>
</tr>
<tr>
<td><img src="screenshots/16-activities-detail-mobile-dark.jpg" alt="Transaction detail, mobile" width="180"/></td>
<td><img src="screenshots/17-activities-mobile-light.jpg" alt="Activities, mobile, light mode" width="180"/></td>
</tr>
</table>

**Settings** — every account, wallet, budget, and customization option in one place; desktop shows the list and the active panel side by side.

<table>
<tr>
<td><img src="screenshots/18-settings-desktop-dark-empty.jpg" alt="Settings, desktop, dark mode" width="300"/></td>
<td><img src="screenshots/19-settings-account-desktop.jpg" alt="Settings, Account panel" width="300"/></td>
<td><img src="screenshots/20-settings-categories-desktop.jpg" alt="Settings, Manage categories panel" width="300"/></td>
</tr>
<tr>
<td><img src="screenshots/22-settings-wallets-desktop.jpg" alt="Settings, Wallets panel" width="300"/></td>
<td><img src="screenshots/24-settings-budgets-desktop.jpg" alt="Settings, Budgets panel" width="300"/></td>
<td><img src="screenshots/25-settings-savingsgoals-desktop.jpg" alt="Settings, Savings goals panel" width="300"/></td>
</tr>
<tr>
<td><img src="screenshots/23-settings-recurring-desktop.jpg" alt="Settings, Recurring transactions panel" width="300"/></td>
<td><img src="screenshots/28-settings-desktop-light-empty.jpg" alt="Settings, desktop, light mode" width="300"/></td>
</tr>
<tr>
<td><img src="screenshots/29-settings-mobile-dark-list.jpg" alt="Settings, mobile" width="180"/></td>
<td><img src="screenshots/30-settings-account-mobile-dark.jpg" alt="Settings, Account panel, mobile" width="180"/></td>
</tr>
</table>

## Known limitations

- **Requires Gemini API key**: Receipt scanning and voice transcription require a free API key from [Google AI Studio](https://aistudio.google.com/apikey). Manual entry and CSV export work without it.
- **Requires Postgres database**: The app stores all data in Postgres (not SQLite). Free tier available via Vercel (uses Neon), or [Railway](https://railway.app).
- **Requires a Resend API key for email**: Password reset emails and the optional recurring/budget notification emails need a free [Resend](https://resend.com) API key. Everything else works without it.
- **No true background photo-monitoring on iOS/Android**: automatic receipt import relies on OS-level automation (iOS Shortcuts, Android's share sheet) rather than the app silently watching your photo library — see the in-app setup guide in Settings > Automatic import.

## Security notes

- **API authentication**: All API routes (`/api/*`) require a valid session token and are protected by middleware. Unauthenticated requests return `401 Unauthorized`.
- **Multi-user accounts, fully isolated**: Anyone can create an account at `/register` (username + password, no email). Every account's expenses, categories, and balance are scoped to that account only — no other account can see or modify them.
- **Password storage**: Passwords are hashed with scrypt (a slow, salted hashing algorithm) before being stored — the plaintext password is never saved anywhere.
- **Session security**: Sessions are signed with HMAC-SHA256 (a mathematical lock that proves no one tampered with your login badge) using `SESSION_SECRET`, stored in httpOnly cookies (locked away where hackers can't access them), and expire after 30 days. Session cookies are marked `Secure` (only works on encrypted websites) and `SameSite=Lax` (protects against tricks) in production.
- **HTTPS required**: Always deploy on HTTPS in production. Session cookies include the `Secure` flag and will not work over plain HTTP.
- **Environment variables**: Store `SESSION_SECRET` (and `ADMIN_BOOTSTRAP_PASSWORD`, if used) securely in your hosting platform's environment variable settings (Vercel, Railway, etc.), not in code. Never commit `.env.local`.
- **Rotate secrets**: If you suspect `SESSION_SECRET` has leaked, rotate it immediately — this invalidates all existing sessions for every account, logging everyone out.

See [Acknowledgments](.github/ACKNOWLEDGMENTS.md) for the author, tech stack, and icon credits.
