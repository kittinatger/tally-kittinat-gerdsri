# Tally — Personal Expense Tracker

A private, personal expense tracker. Add expenses manually or snap a photo of a
receipt and let Gemini's vision API read the merchant, total, date, and
category for you to review before saving.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Ftally&env=POSTGRES_URL,GEMINI_API_KEY,APP_PASSWORD,SESSION_SECRET&envDescription=Required%20environment%20variables%20for%20Tally&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Ftally%2Fblob%2Fmain%2F.env.local.example)

Or follow the [detailed step-by-step Vercel deployment guide](DEPLOYMENT_VERCEL.md) (no technical experience needed).

## Features

- **Manual entry & receipt scanning** — enter expenses/income manually (date, amount, merchant, category, notes) or snap a photo; [Google Gemini](https://ai.google.dev/) extracts the fields and pre-fills the form for you to review.
- **Voice-to-expense** — tap the mic and say something like "spent 12 dollars on coffee at Starbucks today"; Gemini transcribes and extracts the fields for you to review before saving.
- **Bulk scanning** — drop multiple receipt photos at once; they queue up for review and batch-save.
- **Receipt storage** — original scanned images are saved and viewable from the transaction detail.
- **Search & filter** — search by merchant/notes/tags; filter by type (income/expense), category, tags, or date range.
- **Free-form tags** — label transactions with custom tags for cross-cutting groupings.
- **Income tracking** — separate income and expense transaction types with distinct category lists.
- **Customizable categories** — rename and recolor expense/income categories to match your workflow.
- **Spending trends** — see a 6-month trend chart for expenses or income on the Categories page.
- **CSV export** — download filtered transactions in CSV format.
- **Remaining balance** — live-updating balance that auto-calculates from a starting point and all logged transactions.
- **Currency selection** — pick your default currency from the settings menu; formatting updates everywhere immediately.
- **Automatic currency conversion** — optional toggle in settings; when scanning receipts or recording voice memos in a different currency, the detected amount is converted to your default currency (via [Frankfurter](https://frankfurter.app), a free ECB-rate API) before you review it.
- **Password-protected** — single shared password gates the whole app via signed, httpOnly session cookies.
- **Liquid-glass UI** — clean, modern design built for quick entry on a phone and full desktop use.
- **Postgres storage** — works out of the box with [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [`@vercel/postgres`](https://vercel.com/docs/storage/vercel-postgres) for storage
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) for receipt vision extraction (Gemini)

## Local development

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
| `GEMINI_API_KEY` | Yes | Free key from [Google AI Studio](https://aistudio.google.com/apikey). Used only for receipt scanning; manual entry works without it. |
| `APP_PASSWORD` | Yes | The password used to sign in to the app. Pick something you don't use elsewhere. |
| `SESSION_SECRET` | Yes | A random secret that keeps your login session secure. Think of it like a security key that scrambles your session cookie so no one can forge a fake login. Generate one by copying and pasting this into your terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — it will print out a long random string (like `e7b4d9fccc1ade2ae...`). Paste that string as the value for `SESSION_SECRET`. **Important**: Use a different random string for production (on Vercel) than for local development. |

### 3. Get a local Postgres database

Easiest option — use a free [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
database for both local dev and production:

1. Push this repo to GitHub (see below) and import it into a new [Vercel](https://vercel.com) project.
2. In the Vercel project, go to **Storage → Create Database → Postgres**, and connect it to the project.
3. Locally, run `npx vercel link` once to link this folder to the Vercel project, then `npx vercel env pull .env.local` to pull `POSTGRES_URL` (and any other env vars you've set in Vercel) into your local `.env.local`.

The `expenses` table is created automatically on first use — no manual migration step needed.

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` first.

## Deploying privately (GitHub + Vercel)

1. **Push to a private GitHub repo.**
   ```bash
   gh repo create tally --private --source=. --remote=origin
   git push -u origin main
   ```
   (Or create the repo on github.com and add it as a remote yourself — either way, make sure it's **private**.)

2. **Import into Vercel.**
   Go to [vercel.com/new](https://vercel.com/new), select the repo, and deploy. Vercel auto-detects Next.js — no config needed.

3. **Add a Postgres database.**
   In the Vercel project: **Storage → Create Database → Postgres**, then connect it to the project. This automatically sets `POSTGRES_URL` (and friends) as environment variables.

4. **Set the remaining environment variables.**
   In **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `APP_PASSWORD`
   - `SESSION_SECRET`

5. **Redeploy** (Vercel will do this automatically after you save env vars, or trigger it manually from the Deployments tab).

Your app is now live at a `*.vercel.app` URL that only you know, additionally
gated behind the in-app password. For an extra layer, you can also enable
[Vercel's built-in Deployment Protection](https://vercel.com/docs/deployment-protection)
under Project Settings → Deployment Protection.

## Deployment options

- **Vercel** *(recommended for free tier)*: Deploy directly from GitHub with one click. Vercel handles hosting and can provide a free Postgres database. See deployment section above.
- **Railway.app**: A simpler alternative to Vercel with built-in Postgres. Same environment-variable setup, different UI.
- **Fly.io**: Global deployment with built-in Postgres (paid, starts at $5/month for always-on).
- **Docker**: Self-host on your own server. Add a `Dockerfile` and `docker-compose.yml` to containerize the app.

## Known limitations

- **Single-user per instance**: This app uses a shared password (not per-user accounts). Each deployed instance is single-user by design. To share with others, each person must run their own instance.
- **Requires Gemini API key**: Receipt scanning and voice transcription require a free API key from [Google AI Studio](https://aistudio.google.com/apikey). Manual entry and CSV export work without it.
- **Requires Postgres database**: The app stores all data in Postgres (not SQLite). Free tiers available via [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Railway](https://railway.app).

## Security notes

- **API authentication**: All API routes (`/api/*`) require a valid session token and are protected by middleware. Unauthenticated requests return `401 Unauthorized`.
- **Single-user design**: This app uses a single shared password, not per-user accounts. This is appropriate for a personal tool but not for multi-user SaaS. Each instance serves one person or household.
- **Session security**: Sessions are signed with HMAC-SHA256 (a mathematical lock that proves no one tampered with your login badge) using `SESSION_SECRET`, stored in httpOnly cookies (locked away where hackers can't access them), and expire after 30 days. Session cookies are marked `Secure` (only works on encrypted websites) and `SameSite=Lax` (protects against tricks) in production.
- **HTTPS required**: Always deploy on HTTPS in production. Session cookies include the `Secure` flag and will not work over plain HTTP.
- **Environment variables**: Store `APP_PASSWORD` and `SESSION_SECRET` securely in your hosting platform's environment variable settings (Vercel, Railway, etc.), not in code. Never commit `.env.local`.
- **Rotate secrets**: If you suspect `APP_PASSWORD` or `SESSION_SECRET` have leaked, rotate them immediately. Changing `SESSION_SECRET` invalidates all existing sessions.

## Developed by

[Kittinat Gerdsri](https://kittinatger.github.io/kittinat-gerdsri/)

Tally is a personal project designed to make expense tracking simple, private, and self-hosted.
