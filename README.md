# Tally — Personal Expense Tracker

A private, personal expense tracker. Add expenses manually or snap a photo of a
receipt and let Gemini's vision API read the merchant, total, date, and
category for you to review before saving.

## Features

- **Manual entry & receipt scanning** — enter expenses/income manually (date, amount, merchant, category, notes) or snap a photo; [Google Gemini](https://ai.google.dev/) extracts the fields and pre-fills the form for you to review.
- **Bulk scanning** — drop multiple receipt photos at once; they queue up for review and batch-save.
- **Receipt storage** — original scanned images are saved and viewable from the transaction detail.
- **Search & filter** — search by merchant/notes/tags; filter by type (income/expense), category, tags, or date range.
- **Free-form tags** — label transactions with custom tags for cross-cutting groupings.
- **Income tracking** — separate income and expense transaction types with distinct category lists.
- **Customizable categories** — rename and recolor expense/income categories to match your workflow.
- **Spending trends** — see a 6-month trend chart for expenses or income on the Categories page.
- **CSV export** — download filtered transactions in CSV format.
- **Remaining balance** — live-updating balance that auto-calculates from a starting point and all logged transactions.
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
| `SESSION_SECRET` | Yes | Random secret used to sign session cookies. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_CURRENCY` | No | ISO 4217 currency code for display, e.g. `USD`, `EUR`, `GBP`, `THB`. Defaults to `USD`. |

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
   - `NEXT_PUBLIC_CURRENCY` (optional)

5. **Redeploy** (Vercel will do this automatically after you save env vars, or trigger it manually from the Deployments tab).

Your app is now live at a `*.vercel.app` URL that only you know, additionally
gated behind the in-app password. For an extra layer, you can also enable
[Vercel's built-in Deployment Protection](https://vercel.com/docs/deployment-protection)
under Project Settings → Deployment Protection.

## Security notes

- Never commit `.env.local` — it's already covered by `.gitignore`.
- The app uses a single shared password (not per-user accounts), which is
  appropriate for a personal single-user tool but not a multi-user product.
- Rotate `APP_PASSWORD` and `SESSION_SECRET` any time you suspect they've
  leaked; changing `SESSION_SECRET` invalidates all existing sessions.
