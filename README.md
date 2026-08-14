# Tally — Personal Expense Tracker

A private, personal expense tracker. Add expenses manually or snap a photo of a
receipt and let Gemini's vision API read the merchant, total, date, and
category for you to review before saving.

## Just want to use Tally?

You don't need to deploy anything — go to **[tally-kittinat.vercel.app](https://tally-kittinat.vercel.app)** and create your own account. It's free, takes a few seconds, and your data is completely private to your account (no one else, including other accounts on that deployment, can see it).

## Features

- **Manual entry, receipt scanning & voice entry** — enter expenses/income manually (date, amount, merchant, category, notes), snap a photo of a receipt, or tap the mic and describe it out loud; [Google Gemini](https://ai.google.dev/) extracts the fields and pre-fills the form for you to review. Drop multiple receipt photos at once to batch-scan them.
- **Automatic receipt import from Photos** — create a personal access token in Settings > Automatic import, then set up an iOS Shortcut (fully automatic, or a one-tap Share Sheet variant) or the Android share sheet to log receipts without ever opening the app; auto-imported transactions are tagged `auto-import` and keep the source photo attached so you can spot-check them.
- **Wallets** — track balances across multiple cash/bank/e-wallet pools, transfer between them, set a default, archive old ones, and label each with its own currency.
- **Recurring transactions** — rent, subscriptions, salary logged automatically on a weekly/monthly/yearly schedule; editable, pausable, reorderable, and skippable for a single upcoming occurrence.
- **Budgets** — a monthly spending limit per category, a Dashboard progress widget, optional rollover of unused budget into the next month, and a dismissible alert banner when a category nears or goes over its limit.
- **Savings goals** — track progress toward something you're saving for, with manual contribute/withdraw and a Dashboard progress widget.
- **Split transactions** — log one receipt as multiple category lines; shown as a single grouped card in Activities.
- **Search, filter & bulk actions** — search by merchant/notes/tags; filter by type, category, tags, wallet, or date range; bulk-select transactions in Activities to delete or tag them at once; swipe a transaction left/right on mobile for quick delete/share.
- **Free-form tags & customizable categories** — label transactions with custom tags, and rename/recolor/add an icon to expense and income categories to match your workflow.
- **Fully customizable dashboard** — an iOS-style live editor with 50+ widgets (progress rings, gauges, sparklines, donut charts, heatmaps, leaderboards, and more) to build your own layout.
- **CSV export & import** — for transactions, budgets, recurring rules, and savings goals; import accepts common column-name synonyms and infers expense vs. income from the amount's sign.
- **Currency selection & automatic conversion** — pick your default currency in Settings; optionally auto-convert amounts detected in a different currency (via [Frankfurter](https://frankfurter.app), a free ECB-rate API) when scanning, speaking, or viewing the Dashboard's Remaining total.
- **Installable, offline-capable PWA** — install Tally to your home screen; it opens instantly and shows a graceful offline page instead of an error with no connection.
- **Email notifications** — opt in (Settings > Permissions) to an email when a recurring rule auto-logs a transaction or a category goes over budget.
- **Multi-user accounts, fully isolated** — anyone can sign up with their own username and password, or sign in with GitHub (and link/unlink GitHub from an existing account in Settings > Account); each account's data is fully private via signed, httpOnly session cookies. Self-service password reset by email, account deletion, and "sign out of all devices" are all available from Settings.
- **Liquid-glass UI** — clean, modern design built for quick entry on a phone and full desktop use.
- **Postgres storage** — works out of the box with [Vercel's Neon database](https://vercel.com/docs/storage/vercel-postgres) (free tier available).

## Screenshots

**Dashboard** — a fully customizable, live-editable grid of 50+ widgets: balance hero, category breakdown, spending trends, budgets, savings goals, leaderboards, tickers, and more.

<table>
<tr>
<td><img src="screenshots/01-dashboard-desktop-dark.jpg" alt="Dashboard, desktop, dark mode" width="400"/></td>
<td><img src="screenshots/02-dashboard-desktop-light.jpg" alt="Dashboard, desktop, light mode" width="400"/></td>
</tr>
<tr>
<td><img src="screenshots/03-dashboard-mobile-dark.jpg" alt="Dashboard, mobile, dark mode" width="200"/></td>
<td><img src="screenshots/04-dashboard-mobile-light.jpg" alt="Dashboard, mobile, light mode" width="200"/></td>
</tr>
</table>

**Activities** — search, filter, and manage every transaction; desktop gets a two-pane master-detail layout, mobile keeps a focused full-width list with swipe actions.

<table>
<tr>
<td><img src="screenshots/05-activities-desktop-dark.jpg" alt="Activities, desktop, dark mode" width="400"/></td>
<td><img src="screenshots/12-activities-detail-desktop-dark.jpg" alt="Activities with transaction detail open, desktop" width="400"/></td>
</tr>
<tr>
<td><img src="screenshots/06-activities-desktop-light.jpg" alt="Activities, desktop, light mode" width="400"/></td>
<td><img src="screenshots/07-activities-mobile-dark.jpg" alt="Activities, mobile, dark mode" width="180"/></td>
</tr>
</table>

**Settings** — every account, wallet, budget, and customization option in one place; desktop shows the list and the active panel side by side.

<table>
<tr>
<td><img src="screenshots/09-settings-desktop-dark.jpg" alt="Settings, desktop, dark mode" width="400"/></td>
<td><img src="screenshots/13-settings-categories-desktop-dark.jpg" alt="Settings, Manage categories panel open" width="400"/></td>
</tr>
</table>

**Receipt scanning & voice entry** — snap a photo or speak an expense out loud and let Gemini fill in the form.

<table>
<tr>
<td><img src="screenshots/14-scan-document-light.jpg" alt="Document scanning (light mode)" width="250"/></td>
<td><img src="screenshots/15-scan-document-dark.jpg" alt="Document scanning (dark mode)" width="250"/></td>
</tr>
<tr>
<td><img src="screenshots/16-voice-entry-light.jpg" alt="Voice entry (light mode)" width="250"/></td>
<td><img src="screenshots/17-voice-entry-dark.jpg" alt="Voice entry (dark mode)" width="250"/></td>
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

<details>
<summary>Running your own separate instance</summary>

Not recommended for most people — [creating an account on the live instance](#just-want-to-use-tally) already gives you fully private, isolated data. Only do this if you specifically need your own separate database and infrastructure.

If you still want to: [Vercel deploy link](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkittinatger%2Ftally-kittinat-gerdsri&env=POSTGRES_URL,GEMINI_API_KEY,SESSION_SECRET&envDescription=Required%20environment%20variables%20for%20Tally&envLink=https%3A%2F%2Fgithub.com%2Fkittinatger%2Ftally-kittinat-gerdsri%2Fblob%2Fmaster%2F.env.local.example), or the [step-by-step guide](DEPLOYMENT_VERCEL.md) for a fully manual walkthrough.

</details>

<details>
<summary>Local development (for contributors)</summary>

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `POSTGRES_URL` | Yes | Connection string for your Postgres database. If you're using Vercel Postgres, run `vercel env pull .env.local` after creating the database (see below) instead of setting it by hand. |
| `GEMINI_API_KEY` | Yes | Free key from [Google AI Studio](https://aistudio.google.com/apikey). Used for receipt scanning, voice entry, and automatic receipt import; manual entry works without it. |
| `SESSION_SECRET` | Yes | A random secret that keeps your login session secure. Think of it like a security key that scrambles your session cookie so no one can forge a fake login. Generate one by copying and pasting this into your terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — it will print out a long random string (like `e7b4d9fccc1ade2ae...`). Paste that string as the value for `SESSION_SECRET`. **Important**: Use a different random string for production (on Vercel) than for local development. |
| `RESEND_API_KEY` | No | Free key from [Resend](https://resend.com/api-keys). Needed for password reset emails and the optional recurring/budget notification emails; everything else works without it. |
| `EMAIL_FROM` | No | The "from" address for emails Tally sends. Falls back to Resend's shared testing address if unset — use a verified domain for real deployments. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | Enables the "Continue with GitHub" button on login/register. Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers) with its callback URL set to `<your-domain>/api/auth/github/callback`. Leave unset to hide the button; username/password sign-in always works. |
| `ADMIN_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` | No | Only needed once, on the very first deploy of an instance that already has data from before multi-user accounts existed — creates an admin account and assigns that existing data to it. Leave unset on a brand-new install; everyone just signs up at `/register` instead. Remove both after confirming the admin account works. |

### 3. Get a Postgres database

Easiest option — use a free [Neon Postgres database](https://neon.tech) via Vercel:

1. Push this repo to GitHub (see below) and import it into a new [Vercel](https://vercel.com) project.
2. In the Vercel project, go to **Storage → Create Database → Neon**, and connect it to the project.
3. Locally, run `npx vercel link` once to link this folder to the Vercel project, then `npx vercel env pull .env.local` to pull `POSTGRES_URL` (and any other env vars you've set in Vercel) into your local `.env.local`.

**Note**: Vercel's free Postgres tier now uses Neon. It works exactly the same way — just a different provider.

The `expenses` table is created automatically on first use — no manual migration step needed.

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` first.

</details>

Tally is a personal project designed to make expense tracking simple and private. [Create an account](https://tally-kittinat.vercel.app) to use it — no deployment needed.

See [Acknowledgments](.github/ACKNOWLEDGMENTS.md) for the author, tech stack, and icon credits.
