import { sql, db } from "@vercel/postgres";
import { createHash, randomBytes, randomUUID } from "crypto";
import type { ExpenseInput } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { normalizeDashboardWidgets, type DashboardWidgetInstance } from "@/lib/dashboard-widgets";
import type { ChallengeType, ChallengeMode } from "@/lib/challenges";
import type { SplitMethod, SplitPaymentMethod } from "@/lib/splits";

export type Expense = {
  id: number;
  type: string;
  direction: string | null;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
  has_receipt: boolean;
  wallet_id: number | null;
  wallet_name: string | null;
  split_group_id: string | null;
};

// Dates and amounts are cast explicitly to text in every query so the
// output format never depends on driver-specific type parsing (which is a
// common source of off-by-one-day bugs with DATE columns).

// The sql tag's parameter type only allows primitives, not arrays, so tag
// lists are passed as a Postgres array-literal string and cast in SQL.
function toPgTextArray(values: string[]): string {
  const escaped = values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

const DEFAULT_CATEGORIES: Array<{ type: string; name: string; color: string; sort: number }> = [
  { type: "expense", name: "Groceries", color: "emerald", sort: 0 },
  { type: "expense", name: "Food & Drink", color: "amber", sort: 1 },
  { type: "expense", name: "Transport", color: "sky", sort: 2 },
  { type: "expense", name: "Shopping", color: "violet", sort: 3 },
  { type: "expense", name: "Bills & Utilities", color: "rose", sort: 4 },
  { type: "expense", name: "Entertainment", color: "fuchsia", sort: 5 },
  { type: "expense", name: "Health", color: "teal", sort: 6 },
  { type: "expense", name: "Travel", color: "cyan", sort: 7 },
  { type: "expense", name: "Rent & Housing", color: "blue", sort: 8 },
  { type: "expense", name: "Insurance", color: "indigo", sort: 9 },
  { type: "expense", name: "Education", color: "lime", sort: 10 },
  { type: "expense", name: "Subscriptions", color: "pink", sort: 11 },
  { type: "expense", name: "Personal Care", color: "orange", sort: 12 },
  { type: "expense", name: "Gifts & Donations", color: "green", sort: 13 },
  { type: "expense", name: "Pets", color: "sky", sort: 14 },
  { type: "expense", name: "Fees & Charges", color: "rose", sort: 15 },
  { type: "expense", name: "Other", color: "slate", sort: 16 },
  { type: "income", name: "Salary", color: "green", sort: 0 },
  { type: "income", name: "Freelance", color: "indigo", sort: 1 },
  { type: "income", name: "Business", color: "blue", sort: 2 },
  { type: "income", name: "Investment", color: "lime", sort: 3 },
  { type: "income", name: "Gift", color: "pink", sort: 4 },
  { type: "income", name: "Refund", color: "orange", sort: 5 },
  { type: "income", name: "Bonus", color: "amber", sort: 6 },
  { type: "income", name: "Interest & Dividends", color: "emerald", sort: 7 },
  { type: "income", name: "Rental Income", color: "sky", sort: 8 },
  { type: "income", name: "Pension", color: "violet", sort: 9 },
  { type: "income", name: "Grants & Scholarships", color: "cyan", sort: 10 },
  { type: "income", name: "Other", color: "slate", sort: 11 },
  { type: "transfer", name: "Self-transfer", color: "slate", sort: 0 },
  { type: "transfer", name: "E-wallet top-up", color: "cyan", sort: 1 },
  { type: "transfer", name: "Bank transfer", color: "blue", sort: 2 },
  { type: "transfer", name: "Savings", color: "teal", sort: 3 },
  { type: "transfer", name: "Other", color: "slate", sort: 4 },
];

const DEFAULT_TRANSFER_CATEGORIES = DEFAULT_CATEGORIES.filter((d) => d.type === "transfer");

// One-time, best-effort migration of a pre-multi-user deployment's existing
// data to an admin account, so a live instance's data isn't lost when this
// version rolls out. No-ops once a users row exists, and no-ops (retrying on
// the next cold start) if the admin env vars aren't set yet.
async function bootstrapAdminIfNeeded(): Promise<void> {
  const { rows: anyUserRows } = await sql`SELECT id FROM users LIMIT 1;`;
  if (anyUserRows[0]) return;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!adminUsername || !adminPassword) return;

  const passwordHash = await hashPassword(adminPassword);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: adminRows } = await client.sql<{ id: number }>`
      INSERT INTO users (username, password_hash) VALUES (${adminUsername}, ${passwordHash})
      ON CONFLICT (username) DO NOTHING
      RETURNING id;
    `;
    const adminId = adminRows[0]?.id;
    if (adminId) {
      await client.sql`UPDATE expenses SET user_id = ${adminId} WHERE user_id IS NULL;`;
      await client.sql`UPDATE categories SET user_id = ${adminId} WHERE user_id IS NULL;`;
      const { rows: settingsRows } = await client.sql`SELECT id FROM app_settings WHERE id = 1;`;
      if (settingsRows[0]) {
        await client.sql`UPDATE app_settings SET user_id = ${adminId} WHERE id = 1;`;
      } else {
        await client.sql`INSERT INTO app_settings (id, user_id, starting_balance) VALUES (${-adminId}, ${adminId}, 0);`;
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Tightens the multi-user schema once every row has an owner: NOT NULL on
// user_id, and swapping the old global uniqueness/singleton constraints for
// per-user ones. Each block is gated so it's safe to re-run on every cold
// start (a fresh Vercel deployment re-executes ensureSchema() per instance).
async function hardenMultiUserConstraints(): Promise<void> {
  const { rows: expOrphan } = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM expenses WHERE user_id IS NULL;`;
  if ((expOrphan[0]?.n ?? 0) === 0) {
    await sql`ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL;`;
  }

  const { rows: catOrphan } = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM categories WHERE user_id IS NULL;`;
  const { rows: catLegacy } = await sql`SELECT 1 FROM pg_constraint WHERE conname = 'categories_type_name_unique';`;
  if ((catOrphan[0]?.n ?? 0) === 0 && catLegacy[0]) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.sql`ALTER TABLE categories DROP CONSTRAINT categories_type_name_unique;`;
      await client.sql`ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;`;
      await client.sql`ALTER TABLE categories ADD CONSTRAINT categories_user_type_name_unique UNIQUE (user_id, type, name);`;
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // The old singleton seed row (id=1) is only meaningful pre-migration, and
  // only disposable once we know it either got claimed by an admin, or there
  // was never any admin to claim it in the first place (no users exist at
  // all yet — a brand-new install with no legacy data). If ADMIN_* env vars
  // just haven't been set *yet* on an existing deployment, at least one user
  // may still be about to claim this row on a later cold start — don't touch
  // it until we know which case we're in.
  const { rows: anyUserForSettings } = await sql`SELECT id FROM users LIMIT 1;`;
  if (anyUserForSettings[0]) {
    await sql`DELETE FROM app_settings WHERE user_id IS NULL;`;
  }

  const { rows: settingsOrphan } = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM app_settings WHERE user_id IS NULL;`;
  const { rows: settingsLegacy } = await sql`SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_single_row';`;
  if ((settingsOrphan[0]?.n ?? 0) === 0 && settingsLegacy[0]) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.sql`ALTER TABLE app_settings DROP CONSTRAINT app_settings_single_row;`;
      await client.sql`ALTER TABLE app_settings ALTER COLUMN user_id SET NOT NULL;`;
      await client.sql`ALTER TABLE app_settings DROP CONSTRAINT app_settings_pkey;`;
      await client.sql`ALTER TABLE app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (user_id);`;
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

let schemaReady: Promise<void> | null = null;

// Bump this whenever a new ALTER/CREATE is added below the version check.
// Every schema statement in here is already idempotent (IF NOT EXISTS), so
// re-running them is always *safe* — but on serverless, schemaReady's
// in-memory cache is wiped on every cold start, and this function used to
// unconditionally re-run all ~50 of them (each its own network round trip
// to Neon) before the very first query of a cold request could proceed.
// Tracking a version in the DB means a cold start pays for one fast SELECT
// instead, in the common case where nothing's actually changed.
const CURRENT_SCHEMA_VERSION = 41;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS schema_meta (version INTEGER NOT NULL DEFAULT 0);`;
      await sql`INSERT INTO schema_meta (version) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM schema_meta);`;
      const { rows: metaRows } = await sql<{ version: number }>`SELECT version FROM schema_meta LIMIT 1;`;
      if ((metaRows[0]?.version ?? 0) >= CURRENT_SCHEMA_VERSION) {
        return;
      }

      await sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          merchant TEXT NOT NULL,
          category TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      // Added after the initial release to support income entries alongside
      // expenses; existing rows backfill to 'expense' via the column default.
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';`;

      // Free-form labels, separate from the single required category —
      // zero or more per expense, for cross-cutting groupings.
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';`;

      // Only meaningful when type = 'transfer' -- which way the money moved
      // (self-transfers/e-wallet top-ups aren't income or spending, but still
      // move money in or out of the balance Tally tracks).
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS direction TEXT;`;

      // Optional original receipt/document photo, attached after a scanned
      // transaction is saved. Stored directly in Postgres for simplicity —
      // fine at personal scale; a dedicated blob store would be the next
      // step if this ever needs to hold a large volume of images.
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_image BYTEA;`;
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_image_type TEXT;`;

      // Single-row table anchoring the "Remaining" figure: a balance plus the
      // timestamp it was last reset, so only transactions logged after that
      // moment affect it (editing sets Remaining to exactly that value, not
      // a historical starting point that gets replayed against old data).
      await sql`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          starting_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
          CONSTRAINT app_settings_single_row CHECK (id = 1)
        );
      `;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS starting_balance_set_at TIMESTAMPTZ NOT NULL DEFAULT now();`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS auto_convert_currency BOOLEAN NOT NULL DEFAULT false;`;
      // Preferred display language — see src/lib/languages.ts for the
      // selectable list. The app's UI strings are translated incrementally,
      // not all at once, so this only affects surfaces that have been
      // translated so far.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';`;

      // convert_wallet_balances: when a wallet's own currency differs from
      // the app's default, convert it before summing into the Dashboard's
      // Remaining/net-worth figure — off by default since it costs a live
      // exchange-rate lookup per distinct wallet currency on every load.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS convert_wallet_balances BOOLEAN NOT NULL DEFAULT false;`;
      // Opt-in email notifications, sent the next time the dashboard loads
      // after the triggering event (there's no cron worker in this
      // deployment — see processDueRecurringRules).
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notify_recurring_email BOOLEAN NOT NULL DEFAULT false;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notify_budget_email BOOLEAN NOT NULL DEFAULT false;`;

      // Calendar preferences: week_start_day is 0 (Sunday) through 6
      // (Saturday); month_start_day/biweekly_anchor_date define custom
      // budgeting periods; default_view/timezone/show_week_numbers/
      // alternate_calendar are user display preferences.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS week_start_day SMALLINT NOT NULL DEFAULT 0;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS month_start_day SMALLINT NOT NULL DEFAULT 1;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS biweekly_anchor_date DATE;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_view TEXT NOT NULL DEFAULT 'today';`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'auto';`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS show_week_numbers BOOLEAN NOT NULL DEFAULT false;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS alternate_calendar TEXT NOT NULL DEFAULT 'none';`;

      // Ordered list of {id, type, width} tiles for the Dashboard — stored
      // as JSON text rather than JSONB to match how every other setting on
      // this table is a plain scalar column. An empty array is a valid,
      // intentional "cleared my dashboard" state (see normalizeDashboardWidgets),
      // so brand-new rows need a real default layout here, not '[]'.
      await sql`
        ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS dashboard_widgets TEXT NOT NULL DEFAULT
          '[{"id":"summary-default","type":"summary","width":"full"},{"id":"categoryOverview-default","type":"categoryOverview","width":"full"},{"id":"wallets-default","type":"wallets","width":"half"},{"id":"recentTransactions-default","type":"recentTransactions","width":"half"}]';
      `;
      // The default layout changed (dropped categoryOverview, added
      // walletTicker, widened wallets to full) — update the column DEFAULT
      // so brand-new users get the new layout, and backfill any existing
      // row that's still exactly the untouched OLD default literal (i.e.
      // never opened Customize Dashboard) to the new one. Rows that don't
      // match that exact string — including a customized layout that
      // happens to reuse some of the same widgets — are left alone.
      const OLD_DEFAULT_DASHBOARD_WIDGETS =
        '[{"id":"summary-default","type":"summary","width":"full"},{"id":"categoryOverview-default","type":"categoryOverview","width":"full"},{"id":"wallets-default","type":"wallets","width":"half"},{"id":"recentTransactions-default","type":"recentTransactions","width":"half"}]';
      await sql`
        ALTER TABLE app_settings ALTER COLUMN dashboard_widgets SET DEFAULT
          '[{"id":"summary-default","type":"summary","width":"large"},{"id":"wallets-default","type":"wallets","width":"large"},{"id":"walletTicker-default","type":"walletTicker","width":"medium"},{"id":"recentTransactions-default","type":"recentTransactions","width":"medium"}]';
      `;
      await sql`
        UPDATE app_settings SET dashboard_widgets =
          '[{"id":"summary-default","type":"summary","width":"large"},{"id":"wallets-default","type":"wallets","width":"large"},{"id":"walletTicker-default","type":"walletTicker","width":"medium"},{"id":"recentTransactions-default","type":"recentTransactions","width":"medium"}]'
        WHERE dashboard_widgets = ${OLD_DEFAULT_DASHBOARD_WIDGETS};
      `;
      // Once the multi-user migration has hardened this table (see
      // hardenMultiUserConstraints), `id` no longer has any constraint for
      // ON CONFLICT to target — and the legacy singleton row is obsolete by
      // then anyway, so skip re-seeding it entirely past that point.
      const { rows: legacyStillActive } = await sql`SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_single_row';`;
      if (legacyStillActive[0]) {
        await sql`INSERT INTO app_settings (id, starting_balance) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;`;
      }

      // User-editable categories.
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT categories_type_name_unique UNIQUE (type, name)
        );
      `;
      // Optional emoji shown instead of/alongside the color dot wherever a
      // category is displayed. NULL means "just use the color", same as
      // every category had before this column existed.
      await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;`;

      // Accounts. Each user's expenses/categories/settings are fully
      // isolated from every other user's via the user_id columns below.
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT users_username_unique UNIQUE (username)
        );
      `;
      // Bumped by "sign out of all devices" — see lib/session.ts and
      // lib/session-version.ts. Every session token embeds the version it
      // was minted with, so incrementing this invalidates every token
      // issued before the bump, all at once, with no revocation list.
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;`;
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;

      // Optional — only needed for "forgot password" emails. Case-insensitive
      // uniqueness (partial index so multiple accounts can still have no
      // email at all, which is the pre-existing state for every account).
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email)) WHERE email IS NOT NULL;`;

      // GitHub OAuth sign-in — see /api/auth/github. An account created this
      // way has no password (password_hash relaxed to nullable below), so
      // every "confirm with your current password" flow (change username/
      // email, delete account, sign out everywhere — see api/account and
      // api/account/sign-out-everywhere) skips that check when it's null,
      // trusting the session instead. Google/Apple sign-in are scoped but
      // not built yet; this column is GitHub-specific rather than a generic
      // "oauth_provider/oauth_id" pair so each provider's ID stays in its
      // own unambiguous column once added.
      await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT;`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_unique_idx ON users (github_id) WHERE github_id IS NOT NULL;`;

      // Short-lived, single-use tokens for the forgot-password flow. Only
      // token_hash is stored (sha256 of the raw token emailed to the user) so
      // a database leak alone can't be used to reset anyone's password.
      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_hash_idx ON password_reset_tokens (token_hash);`;

      // Personal access tokens for unattended receipt import (iOS Shortcuts
      // automations, or any other personal-automation client) — see
      // lib/receipt-intake.ts and /api/intake/receipt. Unlike password
      // reset tokens these are reusable (no expiry/used_at), since they're
      // meant to sit in a Shortcut and fire repeatedly.
      await sql`
        CREATE TABLE IF NOT EXISTS api_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_used_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS api_tokens_hash_idx ON api_tokens (token_hash);`;

      // One row per failed login attempt, keyed by the submitted username
      // (not user id — the username may not even belong to a real account,
      // which is the point: this rate-limits brute-forcing regardless of
      // whether the account exists, without adding a distinguishable timing
      // or response difference). See recordFailedLoginAttempt /
      // countRecentLoginAttempts in api/auth/login.
      await sql`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS login_attempts_username_idx ON login_attempts (username, created_at);`;

      // One row per Gemini API call (receipt/voice extraction), so those
      // paid calls can be capped per user per day — see
      // recordGeminiUsage/countRecentGeminiUsage. The unattended
      // auto-import path is capped separately via countRecentAutoImports
      // (counting created expenses, since every import there results in
      // one), but interactive scans don't always result in a saved
      // expense, so they need their own call-count table.
      await sql`
        CREATE TABLE IF NOT EXISTS gemini_usage (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS gemini_usage_user_idx ON gemini_usage (user_id, created_at);`;

      // A read-only log of security-sensitive account actions (password
      // changed, email changed, API token created/revoked, signed out of
      // all devices) — see logSecurityEvent/listSecurityEvents and the
      // "Recent security activity" list in Settings > Account. Deliberately
      // not logging account deletion itself: the row would just vanish with
      // the rest of the account (ON DELETE CASCADE), so there'd be no one
      // left to show it to.
      await sql`
        CREATE TABLE IF NOT EXISTS security_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events (user_id, created_at DESC);`;

      // One row per savings-goal contribute/withdraw, so progress has an
      // actual history instead of just the running current_amount total —
      // see updateSavingsGoal/listSavingsGoalContributions.
      await sql`
        CREATE TABLE IF NOT EXISTS savings_goal_contributions (
          id SERIAL PRIMARY KEY,
          goal_id INTEGER NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          delta NUMERIC(12, 2) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS savings_goal_contributions_goal_idx ON savings_goal_contributions (goal_id, created_at DESC);`;

      // Supports listExpenses' WHERE user_id = ... ORDER BY date DESC, id DESC
      // so it stays fast as transaction history grows.
      await sql`CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses (user_id, date DESC, id DESC);`;

      // Wallets: named money pools (cash, bank, e-wallet, etc.) each with
      // their own starting balance, so a user can track more than one
      // account. Every expense optionally belongs to one; deleting a wallet
      // reassigns its expenses rather than orphaning them (see deleteWallet).
      await sql`
        CREATE TABLE IF NOT EXISTS wallets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT 'slate',
          starting_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
          starting_balance_set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL;`;
      await sql`CREATE INDEX IF NOT EXISTS expenses_wallet_idx ON expenses (wallet_id);`;

      // Whether a wallet represents physical cash or a digital account (bank,
      // e-wallet, card) — purely descriptive, doesn't affect balance math.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'cash';`;

      // One-time guard so the default wallet's balance gets synced from the
      // pre-wallets app_settings starting balance exactly once — otherwise
      // every new account's wallet (correctly starting at 0) would get
      // re-synced from app_settings on every cold start too.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS legacy_balance_synced BOOLEAN NOT NULL DEFAULT false;`;

      // Links the two legs (one 'out', one 'in') of a wallet-to-wallet
      // transfer created via createWalletTransfer, so deleting either side
      // deletes both and the wallets don't end up out of sync.
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS transfer_group_id TEXT;`;

      // is_default: which wallet new/edited transactions fall back to when
      // no wallet is explicitly chosen (see resolveWalletId). archived:
      // hidden from wallet pickers and balance aggregates, but its history
      // stays intact and it's still viewable/editable in Settings. currency:
      // NULL means "use the app's default currency" — purely a display
      // label for that wallet, amounts aren't converted.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency TEXT;`;

      // Optional pattern/gradient background (JSON text: {pattern, colors})
      // for the card visual — see card-backgrounds.ts. NULL means "no
      // pattern chosen", i.e. render the plain `color` gradient as before
      // this existed. Same TEXT-not-JSONB convention as membership_cards.layout.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS background TEXT;`;

      // Manual text-color override for the card visual — null means
      // auto-contrast against the background (see cardForegroundFor in
      // card-backgrounds.ts).
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS text_color TEXT;`;

      // Payment-card visuals, folded in from the old standalone wallet_cards
      // table (see the data migration below) — every wallet can now
      // optionally *also* look like a payment card, rather than "accounts"
      // and "cards" being two separate lists. NULL network means "no card
      // look" — render as a plain account (AccountCardShape), same as
      // every wallet before this existed. Column meanings otherwise mirror
      // wallet_cards' identically-named columns exactly (see the comments
      // on that table, still below, kept only as the migration's source of
      // truth and a rollback safety net — the app no longer reads from it).
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS holder_name TEXT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last4 TEXT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS expiry_month SMALLINT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS expiry_year SMALLINT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network TEXT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_network_badge BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS badge_position TEXT NOT NULL DEFAULT 'topRight';`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS icon_color TEXT;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_chip BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS chip_color TEXT NOT NULL DEFAULT 'gold';`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS chip_position TEXT NOT NULL DEFAULT 'middleLeft';`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS notes TEXT;`;

      // Per-wallet toggles for what shows on the card face — independent of
      // whether it has a card look at all (network IS NOT NULL). All
      // default true so every existing wallet (and every migrated card, see
      // below) keeps rendering exactly as it did before these existed.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_balance BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_currency BOOLEAN NOT NULL DEFAULT true;`;

      // Whether the masked "•••• •••• •••• 1234" card-number row shows at
      // all — since no full PAN is ever stored (see the wallet_cards
      // comment below), that row is always the last4 digits at best and
      // an all-dots placeholder at worst, which some users would rather
      // just not show.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_card_number BOOLEAN NOT NULL DEFAULT true;`;

      // Whether the wallet's name renders on the card face at all —
      // separate from every other toggle above, for a card whose network
      // badge/logo already makes it obvious what it is.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_name BOOLEAN NOT NULL DEFAULT true;`;

      // A "premade card" flag — once set, updateWallet below rejects any
      // change to visual/identity fields (only archived and locked itself
      // stay writable), and the editor UI shows a stripped-down locked view
      // instead of the full form. Built for cards whose look is meant to be
      // fixed once set up (e.g. a real transit-card photo background) so it
      // can't be nudged out of shape by an accidental edit.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;`;

      // Which wallet the Activities page's balance card is scoped to on
      // load — separate from is_default (which wallet new transactions fall
      // back to). NULL means "All wallets". Set null rather than cascading
      // the row away if the chosen wallet is later deleted.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS activities_default_wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL;`;

      // Links every line of a one-receipt-multiple-categories split to its
      // siblings for display grouping — each line is otherwise a normal,
      // independently editable/deletable expense row (see createSplitExpense).
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_group_id TEXT;`;

      // Auto-logged transactions on a schedule (rent, subscriptions, salary):
      // one rule per recurring transaction, materialized into real expense
      // rows by processDueRecurringRules whenever next_run_date has passed.
      await sql`
        CREATE TABLE IF NOT EXISTS recurring_rules (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          direction TEXT,
          amount NUMERIC(12, 2) NOT NULL,
          merchant TEXT NOT NULL,
          category TEXT NOT NULL,
          notes TEXT,
          wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
          frequency TEXT NOT NULL,
          next_run_date DATE NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS recurring_rules_user_idx ON recurring_rules (user_id);`;
      await sql`ALTER TABLE recurring_rules ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;`;

      // Per-category monthly spending limits. One row per category the user
      // has budgeted; categories with no row here are simply untracked.
      await sql`
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          monthly_limit NUMERIC(12, 2) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT budgets_user_category_unique UNIQUE (user_id, category)
        );
      `;
      // Which month a near/over-limit alert for this budget was last
      // dismissed for — a dismissal only silences the alert for that one
      // month; it reappears once a new month starts.
      await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS dismissed_alert_month TEXT;`;
      // Whether unused budget carries forward into the next month (compounding,
      // capped at a 12-month lookback — see computeEffectiveBudgetLimit).
      await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS rollover BOOLEAN NOT NULL DEFAULT false;`;
      // Separate from dismissed_alert_month: tracks which month we last sent
      // an over-budget email for, so it only ever sends once per month even
      // if the in-app banner was dismissed (or wasn't).
      await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notified_alert_month TEXT;`;

      // Manually-tracked savings goals — current_amount is nudged by the
      // user via contributeToSavingsGoal rather than derived from real
      // transactions, so a goal can represent cash saved anywhere (even
      // outside a wallet Tally tracks).
      await sql`
        CREATE TABLE IF NOT EXISTS savings_goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT 'emerald',
          target_amount NUMERIC(12, 2) NOT NULL,
          current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;`;

      await bootstrapAdminIfNeeded();
      await hardenMultiUserConstraints();

      // Every account that existed before wallets shipped needs a default
      // wallet seeded (registration seeds one for brand-new accounts going
      // forward — see seedDefaultWalletForUser), and any of their expenses
      // left without a wallet_id get assigned to it.
      await sql`
        INSERT INTO wallets (user_id, name, color, sort_order, is_default)
        SELECT u.id, 'Cash', 'slate', 0, true FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = u.id);
      `;
      await sql`
        UPDATE expenses e
        SET wallet_id = w.id
        FROM wallets w
        WHERE e.wallet_id IS NULL AND w.user_id = e.user_id AND w.sort_order = 0;
      `;

      // Belt-and-suspenders: guarantees every user has exactly one default
      // wallet even if is_default was never set for them (e.g. rows created
      // before this column existed). No-ops once a user already has one.
      await sql`
        UPDATE wallets w
        SET is_default = true
        FROM (
          SELECT DISTINCT ON (user_id) id, user_id
          FROM wallets
          ORDER BY user_id, sort_order, id
        ) first_wallet
        WHERE w.id = first_wallet.id
          AND NOT EXISTS (SELECT 1 FROM wallets w2 WHERE w2.user_id = w.user_id AND w2.is_default = true);
      `;

      // The "Remaining" figure on the Dashboard used to be tracked
      // independently on app_settings; now it's derived from wallets (see
      // getRemaining), so the default wallet needs to inherit whatever
      // balance/anchor the user had there, or Remaining would jump to 0.
      await sql`
        UPDATE wallets w
        SET starting_balance = s.starting_balance,
            starting_balance_set_at = s.starting_balance_set_at,
            legacy_balance_synced = true
        FROM app_settings s
        WHERE w.user_id = s.user_id AND w.sort_order = 0 AND w.legacy_balance_synced = false;
      `;

      // Transfer categories were added after the initial multi-user release,
      // so existing accounts (seeded before this point) need them backfilled.
      // seedDefaultCategoriesForUser only runs once, at registration, so this
      // catches everyone who signed up before transfers existed.
      const { rows: categoriesHardened } = await sql`
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_type_name_unique';
      `;
      if (categoriesHardened[0]) {
        for (const d of DEFAULT_TRANSFER_CATEGORIES) {
          await sql`
            INSERT INTO categories (user_id, type, name, color, sort_order)
            SELECT id, ${d.type}, ${d.name}, ${d.color}, ${d.sort} FROM users
            ON CONFLICT (user_id, type, name) DO NOTHING;
          `;
        }
      }

      // Add profile picture column (stores image as bytea)
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture BYTEA;`;

      // Friend requests: a single row per (requester, addressee) pair,
      // status flips from 'pending' to 'accepted' (or the row is deleted on
      // decline/cancel — no need to keep a record of a declined request).
      // Once accepted, the friendship is symmetric: either side's id can be
      // the requester, so "are these two people friends" always checks both
      // directions.
      await sql`
        CREATE TABLE IF NOT EXISTS friend_requests (
          id SERIAL PRIMARY KEY,
          requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          responded_at TIMESTAMPTZ,
          CONSTRAINT friend_requests_pair_unique UNIQUE (requester_id, addressee_id),
          CONSTRAINT friend_requests_no_self CHECK (requester_id <> addressee_id)
        );
      `;

      // Family is a subset of Friends: marking someone as family is
      // one-directional (only meaningful from the marking user's own point
      // of view) and enforced at the application layer to require an
      // existing accepted friendship — no DB-level FK to friend_requests,
      // since the friendship could later be removed without needing to
      // cascade this too.
      await sql`
        CREATE TABLE IF NOT EXISTS family_members (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT family_members_pair_unique UNIQUE (user_id, member_id),
          CONSTRAINT family_members_no_self CHECK (user_id <> member_id)
        );
      `;

      // Challenges: a savings race, spending-limit contest, or no-spend-days
      // contest run against (or alongside) friends/family. `target_amount`'s
      // meaning depends on `type` (a savings target to reach, a spending cap
      // not to exceed, or a target day count) and applies per-participant in
      // "competitive" mode or to the shared pool in "collaborative" mode.
      // `category` is only meaningful for the spending_limit type (null
      // means "all spending").
      await sql`
        CREATE TABLE IF NOT EXISTS challenges (
          id SERIAL PRIMARY KEY,
          creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          mode TEXT NOT NULL,
          target_amount NUMERIC(12, 2) NOT NULL,
          category TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // One row per invited/participating user. progress_amount is a
      // write-through cache: for the auto-tracked types (spending_limit,
      // no_spend_days) it's recomputed from the viewer's OWN expenses every
      // time they open the challenge (see recomputeChallengeProgress) —
      // never from another participant's data, since each account's
      // transactions stay private. For the savings type it's incremented
      // directly by manual contributions (mirrors savings_goals).
      await sql`
        CREATE TABLE IF NOT EXISTS challenge_participants (
          id SERIAL PRIMARY KEY,
          challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'invited',
          progress_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          progress_updated_at TIMESTAMPTZ,
          joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT challenge_participants_unique UNIQUE (challenge_id, user_id)
        );
      `;

      // In a competitive challenge, other participants only ever see your
      // rank/percent by default (see getChallenge) — this table is the
      // consent record for revealing your exact progress_amount to a
      // specific requester, which only takes effect once you accept it.
      await sql`
        CREATE TABLE IF NOT EXISTS challenge_reveal_requests (
          id SERIAL PRIMARY KEY,
          challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
          requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          target_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          responded_at TIMESTAMPTZ,
          CONSTRAINT challenge_reveal_requests_unique UNIQUE (challenge_id, requester_id, target_id),
          CONSTRAINT challenge_reveal_requests_no_self CHECK (requester_id <> target_id)
        );
      `;

      // Split bills: one row per bill, one participant row per person
      // (including the creator). owed_amount is each participant's share
      // of total_amount; paid_amount is what they actually contributed —
      // (paid_amount - owed_amount) is their net balance on the bill,
      // positive meaning they're owed money back, negative meaning they
      // still owe. Deliberately not linked to the expenses table: a split
      // is a standalone ledger of "who owes whom for a shared bill," not a
      // personal transaction.
      await sql`
        CREATE TABLE IF NOT EXISTS splits (
          id SERIAL PRIMARY KEY,
          creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          total_amount NUMERIC(12, 2) NOT NULL,
          split_method TEXT NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // confirm_status starts 'accepted' unless the creator has
      // require_split_confirmation turned on, in which case every
      // participant but the creator starts 'pending' until they respond.
      await sql`
        CREATE TABLE IF NOT EXISTS split_participants (
          id SERIAL PRIMARY KEY,
          split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          owed_amount NUMERIC(12, 2) NOT NULL,
          paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          confirm_status TEXT NOT NULL DEFAULT 'accepted',
          settled BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT split_participants_unique UNIQUE (split_id, user_id)
        );
      `;

      // Per-user preference: whether a split you create needs the other
      // participants to accept before it counts, or is added immediately.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS require_split_confirmation BOOLEAN NOT NULL DEFAULT false;`;

      // Loyalty/membership cards for shops and restaurants — code_format is
      // constrained (in validation.ts, not here) to exactly the symbologies
      // both the client-side renderer (qrcode/jsbarcode) and the camera
      // scanner (@zxing/browser) support: 'qr' | 'code128' | 'ean13' | 'upc'.
      await sql`
        CREATE TABLE IF NOT EXISTS membership_cards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          code_value TEXT NOT NULL,
          code_format TEXT NOT NULL DEFAULT 'qr',
          color TEXT NOT NULL DEFAULT 'slate',
          icon TEXT,
          notes TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // Pass template (visual shape + which extra fields apply) and the
      // template-specific field values/custom zone layout, stored as JSON
      // text — same convention as app_settings.dashboard_widgets, not
      // JSONB, to match how every other semi-structured column here works.
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'generic';`;
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS fields TEXT NOT NULL DEFAULT '{}';`;
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS layout TEXT;`;

      // Optional logo (small, top-left of the pass) and banner (full-width
      // hero image) — stored as BYTEA directly in Postgres, same convention
      // as expenses.receipt_image (see attachReceiptImage), rather than
      // Vercel Blob storage, so this doesn't introduce a second storage
      // system just for two more images.
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS logo_image BYTEA;`;
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS logo_image_type TEXT;`;
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS banner_image BYTEA;`;
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS banner_image_type TEXT;`;

      // Splits the old single "Memberships" list into two tabs on the
      // merged /wallet page — 'pass' for tickets/coupons/boarding passes,
      // 'membership' for loyalty/store cards. Which tab a card was created
      // from decides this; existing rows default to 'membership' since
      // that's what this table originally was.
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'membership';`;

      // Same background-pattern column as wallets.background — see
      // card-backgrounds.ts.
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS background TEXT;`;

      // Same manual text-color override as wallets.text_color.
      await sql`ALTER TABLE membership_cards ADD COLUMN IF NOT EXISTS text_color TEXT;`;

      // RETIRED as of schema v35 — its rows were one-time-copied onto
      // wallets (see the wallets.network/holder_name/... columns and the
      // migration below) so the app's "accounts" and "cards" lists could
      // become one unified list. Nothing in the app reads or writes this
      // table any more; it's kept only as the migration's data source and
      // an easy rollback path, not dropped outright. Original comment,
      // still accurate for the columns below: payment-card *visuals*,
      // purely decorative pass-style art (like Apple Wallet's card
      // display), not a real payment method — only the last 4 digits were
      // ever stored, never a full card number.
      await sql`
        CREATE TABLE IF NOT EXISTS wallet_cards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          label TEXT NOT NULL,
          holder_name TEXT,
          last4 TEXT,
          expiry_month SMALLINT,
          expiry_year SMALLINT,
          network TEXT NOT NULL DEFAULT 'other',
          color TEXT NOT NULL DEFAULT 'slate',
          notes TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // Same background-pattern column as wallets.background — see
      // card-backgrounds.ts.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS background TEXT;`;

      // Whether the (generic, non-trademark — see WalletCardShape.tsx)
      // network badge is shown on the card visual at all.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS show_network_badge BOOLEAN NOT NULL DEFAULT true;`;

      // Same manual text-color override as wallets.text_color.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS text_color TEXT;`;

      // Whether the EMV contact-chip visual (see EMVChip in
      // WalletCardShape.tsx) is shown, and which finish it renders in —
      // see chip-colors.ts.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS show_chip BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS chip_color TEXT NOT NULL DEFAULT 'gold';`;

      // Which corner the network badge sits in — see badge-position.ts.
      // Default matches the badge's original always-top-right placement.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS badge_position TEXT NOT NULL DEFAULT 'topRight';`;

      // Where the EMV chip sits — see chip-position.ts. Default matches the
      // chip's original placement (inline next to the card number).
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS chip_position TEXT NOT NULL DEFAULT 'middleLeft';`;

      // A manual color override for the network badge/logo specifically —
      // separate from text_color, so the badge can be recolored (or kept
      // its own brand color) independently of the label/holder/expiry
      // text. Null means auto: same computed contrast color the text uses.
      // Only affects the visa/discover mask-recolored badge and the
      // generic NetworkBadge monogram (see WalletCardShape.tsx) — the
      // other networks render a fixed-color brand logo image that isn't
      // tintable at all.
      await sql`ALTER TABLE wallet_cards ADD COLUMN IF NOT EXISTS icon_color TEXT;`;

      // Wallets absorbed wallet_cards' purely-decorative payment-card
      // visuals (see the new wallets.network/holder_name/last4/... columns
      // above) so "accounts" and "cards" are one unified list instead of
      // two. This one-time copy makes every existing wallet_cards row a
      // real wallet — kind defaults to 'digital' (a payment card was never
      // physical cash), balance starts at 0 (wallet_cards never tracked
      // one), and show_balance/show_currency default to false so a
      // migrated card keeps looking exactly like it did as a purely
      // decorative visual, not suddenly sprouting a "$0.00" balance nobody
      // asked for — the toggles are right there if the user wants to turn
      // it into a real tracked account afterward. wallet_cards itself is
      // deliberately left in place (unused by the app from here on) rather
      // than dropped, as a rollback safety net; migrated_from_card_id
      // makes this copy idempotent if the migration ever has to re-run
      // (e.g. a crash mid-migration on a cold start).
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS migrated_from_card_id INTEGER;`;
      await sql`
        INSERT INTO wallets (
          user_id, name, color, background, text_color, kind, sort_order,
          holder_name, last4, expiry_month, expiry_year, network,
          show_network_badge, badge_position, icon_color, show_chip, chip_color,
          chip_position, notes, show_balance, show_currency, migrated_from_card_id
        )
        SELECT
          wc.user_id, wc.label, wc.color, wc.background, wc.text_color, 'digital',
          COALESCE((SELECT MAX(w2.sort_order) FROM wallets w2 WHERE w2.user_id = wc.user_id), -1)
            + ROW_NUMBER() OVER (PARTITION BY wc.user_id ORDER BY wc.sort_order, wc.id),
          wc.holder_name, wc.last4, wc.expiry_month, wc.expiry_year, wc.network,
          wc.show_network_badge, wc.badge_position, wc.icon_color, wc.show_chip, wc.chip_color,
          wc.chip_position, wc.notes, false, false, wc.id
        FROM wallet_cards wc
        WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.migrated_from_card_id = wc.id);
      `;

      // Multiple receipt photos per expense. expenses.receipt_image/
      // receipt_image_type (the original single-image columns) are left
      // in place for backward compatibility — every receipt attached
      // before this migration stays reachable at its existing URL. New
      // uploads after this ships go here instead; see
      // api/expenses/[id]/receipts/route.ts.
      await sql`
        CREATE TABLE IF NOT EXISTS expense_receipts (
          id SERIAL PRIMARY KEY,
          expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
          image BYTEA NOT NULL,
          image_type TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS expense_receipts_expense_id_idx ON expense_receipts (expense_id);`;

      // Debt/loan tracker — a standalone ledger like `splits`/
      // `split_participants` above, but for an ongoing lent/borrowed
      // amount with a manual payoff schedule rather than a one-off shared
      // expense. Deliberately not linked to `expenses` for the same reason
      // splits aren't. counterparty_friend_id is nullable: an IOU can be
      // with someone not on Tally at all (counterparty_name covers that
      // case; one of the two is always set, enforced at the app layer).
      await sql`
        CREATE TABLE IF NOT EXISTS loans (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          counterparty_friend_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          counterparty_name TEXT,
          direction TEXT NOT NULL CHECK (direction IN ('lent','borrowed')),
          principal NUMERIC(12,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS loan_installments (
          id SERIAL PRIMARY KEY,
          loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
          due_date DATE NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          paid BOOLEAN NOT NULL DEFAULT false,
          paid_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS loan_installments_loan_id_idx ON loan_installments (loan_id);`;

      // A public, read-only share link for a split — see
      // getOrCreateSplitShareToken/getSplitByShareToken and
      // app/splits/[token]/page.tsx. Nullable/generated on demand, so
      // existing splits are unaffected until someone taps "Copy share link".
      await sql`ALTER TABLE splits ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;`;

      // Shared/household wallets: an invited friend can view and post
      // transactions to a wallet they don't own. Ownership itself stays a
      // single wallets.user_id column (unchanged) — this table only adds
      // *members* on top of that, modeled on friend_requests (pending/
      // accepted/declined, unique pair, no-self-share). The wallet's
      // balance query already SUMs every expense with a matching
      // wallet_id regardless of who posted it, so it needed no change;
      // what needed widening was: which wallets a member can see at all
      // (listWallets), which wallet ids a member can post an expense
      // against (resolveWalletId), and which expenses a member can see
      // beyond their own postings (listExpenses) — see those three
      // functions.
      await sql`
        CREATE TABLE IF NOT EXISTS wallet_members (
          id SERIAL PRIMARY KEY,
          wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
          invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(wallet_id, user_id)
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS wallet_members_user_id_idx ON wallet_members (user_id) WHERE status = 'accepted';`;

      // Biometric app-lock (WebAuthn/passkey credentials) — a device-local
      // second gate shown on top of the existing cookie session, not a
      // login replacement (see AppLockGate.tsx). credential_id/public_key
      // are stored base64url, exactly as the browser/authenticator hands
      // them back — see lib/webauthn.ts.
      await sql`
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          credential_id TEXT NOT NULL UNIQUE,
          public_key TEXT NOT NULL,
          counter BIGINT NOT NULL DEFAULT 0,
          device_label TEXT,
          transports TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_used_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS webauthn_credentials_user_idx ON webauthn_credentials (user_id);`;

      // Per-account toggle: whether app-lock should be shown at all. Off by
      // default — enrolling a credential doesn't turn this on by itself,
      // since a user might register a device and decide against enforcing
      // it yet (see AppLockSettingsPanel.tsx).
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS applock_enabled BOOLEAN NOT NULL DEFAULT false;`;

      // Numeric passcode (4-8 digits), an alternative unlock method to
      // WebAuthn for app-lock — same scrypt hash format as users.password_hash
      // (see lib/password.ts), just a much shorter/lower-entropy input, so
      // verification is rate-limited via the existing login_attempts table
      // (keyed "applock:<userId>", not a real username) rather than trusted
      // to be safe from brute-forcing on its own.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS applock_pin_hash TEXT;`;

      // How long the app can sit backgrounded before AppLockGate re-locks it
      // on return — 0 means "immediately" (the original, only behavior).
      // Stored in seconds so the UI's minute/hour options are just simple
      // multiples, not a second unit conversion layer.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS applock_timeout_seconds INTEGER NOT NULL DEFAULT 0;`;

      // Recurring splits: a template (like recurring_rules is for
      // expenses) that materializes a real `splits` row via createSplit()
      // whenever next_run_date comes due — see processDueRecurringSplits.
      // participant_ids is stored as a JSON array of user ids rather than
      // a child table, matching the same TEXT-not-a-real-relation
      // convention as dashboard_widgets/membership_cards.fields elsewhere
      // in this file, since it's always read/written as one whole list,
      // never queried row-by-row.
      await sql`
        CREATE TABLE IF NOT EXISTS recurring_splits (
          id SERIAL PRIMARY KEY,
          creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          total_amount NUMERIC(12,2) NOT NULL,
          split_method TEXT NOT NULL,
          participant_ids TEXT NOT NULL,
          frequency TEXT NOT NULL,
          next_run_date DATE NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS recurring_splits_creator_idx ON recurring_splits (creator_id);`;

      // Web Push subscriptions — one row per browser/device that's opted
      // in (a user can have several, e.g. phone + laptop). endpoint is the
      // push service's unique per-subscription URL; p256dh/auth are the
      // subscription's own encryption keys the browser hands back from
      // PushSubscription.toJSON().keys — see lib/push.ts. Deleted
      // automatically once the push service reports it as gone (410/404),
      // not just when the user manually disables the setting.
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);`;

      // Per-account opt-in for push reminders (loan installments coming
      // due) — separate from having a subscription at all, so disabling
      // this doesn't require the browser to actually unsubscribe.
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notify_push_reminders BOOLEAN NOT NULL DEFAULT false;`;

      // Guards against re-notifying about the same installment every day
      // the cron job runs until it's paid off.
      await sql`ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;`;

      // Not secret — just lets the unlock screen show the right number of
      // dot slots for this account's passcode (4-8) instead of a vague
      // "grows as you type" indicator. Set/cleared alongside
      // applock_pin_hash, never derived from it (the hash alone doesn't
      // reveal length).
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS applock_pin_length SMALLINT;`;

      // wallets.locked (a v37→v38 "lock this card" toggle) got replaced by
      // the template-submission flow below before it ever shipped a UI
      // that used it, so it's dropped again here rather than carried
      // forward unused — the only DROP COLUMN in this file, everything
      // else above is additive-only, but there's no real data to lose.
      await sql`ALTER TABLE wallets DROP COLUMN IF EXISTS locked;`;

      // User-submitted card-face designs (background + colors, the same
      // shape WalletCardShape/AccountCardShape already render) pending
      // review before they become selectable by everyone as a "premade
      // card" — see isAdminUser (admin.ts) for who can approve/reject.
      // submitted_by is nullable-on-delete rather than cascading: an
      // already-approved template stays available to everyone even if the
      // submitter's account is later removed.
      await sql`
        CREATE TABLE IF NOT EXISTS card_templates (
          id SERIAL PRIMARY KEY,
          submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          background TEXT,
          text_color TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          reviewed_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS card_templates_status_idx ON card_templates (status);`;

      // Optional per-toggle overrides the template's author can opt into —
      // NULL means "don't touch this toggle, leave whatever the person
      // applying the template already had"; true/false means "force it to
      // this value" (e.g. an author submitting an official logo card might
      // force show_network_badge=false and show_name=false since the
      // artwork already makes the network/name obvious). Applied client-
      // side by PremadeCardPicker's caller alongside background/color/
      // textColor — these aren't part of the visual skin exactly, but they
      // travel with the template the same way.
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_name BOOLEAN;`;
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_network_badge BOOLEAN;`;
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_chip BOOLEAN;`;
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_card_number BOOLEAN;`;
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_balance BOOLEAN;`;
      await sql`ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS force_show_currency BOOLEAN;`;

      // The holder-name/expiry row rendered unconditionally regardless of
      // every other show_* toggle — a wallet with everything else hidden
      // could still show real holder-name text with no way to hide it.
      // Same convention as the rest: default true so nothing existing
      // changes.
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_holder_name BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS show_expiry BOOLEAN NOT NULL DEFAULT true;`;

      await sql`UPDATE schema_meta SET version = ${CURRENT_SCHEMA_VERSION};`;
    })();
  }
  return schemaReady;
}

// ---- Push notifications -----------------------------------------------

export type PushSubscriptionRow = { id: number; endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(userId: number, endpoint: string, p256dh: string, auth: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${userId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (endpoint) DO UPDATE SET user_id = ${userId}, p256dh = ${p256dh}, auth = ${auth};
  `;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint};`;
}

export async function listPushSubscriptionsForUser(userId: number): Promise<PushSubscriptionRow[]> {
  await ensureSchema();
  const { rows } = await sql<PushSubscriptionRow>`SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId};`;
  return rows;
}

export async function getNotifyPushReminders(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ notify_push_reminders: boolean }>`SELECT notify_push_reminders FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.notify_push_reminders ?? false;
}

export async function setNotifyPushReminders(userId: number, enabled: boolean): Promise<void> {
  await ensureSchema();
  await sql`UPDATE app_settings SET notify_push_reminders = ${enabled} WHERE user_id = ${userId};`;
}

export type DueInstallmentReminder = {
  userId: number;
  installmentId: number;
  amount: string;
  direction: "lent" | "borrowed";
  counterpartyName: string;
};

// Every unpaid, un-reminded installment due today or earlier, for a user
// who both has push notifications on and at least one live subscription
// (no point building the reminder list for someone who can't receive it).
// Called only from the daily cron job (api/cron/push-reminders) — nothing
// else in the app triggers this, since there's no background worker
// otherwise (see the same "no background worker" note on the email
// notification toggles this mirrors).
export async function listDueInstallmentReminders(): Promise<DueInstallmentReminder[]> {
  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await sql<{
    user_id: number;
    installment_id: number;
    amount: string;
    direction: "lent" | "borrowed";
    counterparty_name: string | null;
    counterparty_username: string | null;
  }>`
    SELECT l.user_id, li.id AS installment_id, li.amount::text AS amount, l.direction,
           l.counterparty_name, u.username AS counterparty_username
    FROM loan_installments li
    JOIN loans l ON l.id = li.loan_id
    LEFT JOIN users u ON u.id = l.counterparty_friend_id
    WHERE li.paid = false AND li.reminder_sent_at IS NULL AND li.due_date <= ${today}
      AND EXISTS (SELECT 1 FROM app_settings s WHERE s.user_id = l.user_id AND s.notify_push_reminders = true)
      AND EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = l.user_id);
  `;
  return rows.map((r) => ({
    userId: r.user_id,
    installmentId: r.installment_id,
    amount: r.amount,
    direction: r.direction,
    counterpartyName: r.counterparty_name ?? r.counterparty_username ?? "someone",
  }));
}

export async function markInstallmentReminderSent(installmentId: number): Promise<void> {
  await ensureSchema();
  await sql`UPDATE loan_installments SET reminder_sent_at = now() WHERE id = ${installmentId};`;
}

export type CategoryRow = {
  id: number;
  type: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
};

export async function listCategories(userId: number): Promise<CategoryRow[]> {
  await ensureSchema();
  const { rows } = await sql<CategoryRow>`
    SELECT id, type, name, color, icon, sort_order
    FROM categories
    WHERE user_id = ${userId}
    ORDER BY type, sort_order, id;
  `;
  return rows;
}

export async function createCategory(
  userId: number,
  type: string,
  name: string,
  color: string,
  icon?: string | null,
): Promise<CategoryRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM categories WHERE user_id = ${userId} AND type = ${type};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<CategoryRow>`
    INSERT INTO categories (user_id, type, name, color, icon, sort_order)
    VALUES (${userId}, ${type}, ${name}, ${color}, ${icon ?? null}, ${nextSort})
    RETURNING id, type, name, color, icon, sort_order;
  `;
  return rows[0];
}

export async function updateCategory(
  userId: number,
  id: number,
  input: { name?: string; color?: string; icon?: string | null },
): Promise<CategoryRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<CategoryRow>`
    SELECT id, type, name, color, icon, sort_order FROM categories WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const trimmedName = input.name?.trim();
  if (existing.name === "Other" && trimmedName !== undefined && trimmedName !== "Other") {
    throw new Error('The "Other" category can\'t be renamed — it\'s used as the fallback everywhere.');
  }

  const newName = trimmedName ?? existing.name;
  const newColor = input.color ?? existing.color;
  const newIcon = input.icon !== undefined ? input.icon : existing.icon;

  const { rows } = await sql<CategoryRow>`
    UPDATE categories
    SET name = ${newName}, color = ${newColor}, icon = ${newIcon}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, type, name, color, icon, sort_order;
  `;

  if (trimmedName !== undefined && trimmedName !== existing.name) {
    await sql`
      UPDATE expenses SET category = ${newName}
      WHERE user_id = ${userId} AND type = ${existing.type} AND category = ${existing.name};
    `;
  }

  return rows[0] ?? null;
}

export async function deleteCategory(
  userId: number,
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  const { rows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order FROM categories WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = rows[0];
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.name === "Other") {
    return { ok: false, error: 'The "Other" category can\'t be deleted — it\'s used as the fallback everywhere.' };
  }

  await sql`
    UPDATE expenses SET category = 'Other'
    WHERE user_id = ${userId} AND type = ${existing.type} AND category = ${existing.name};
  `;
  await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${userId};`;
  return { ok: true };
}

export type WalletRow = {
  id: number;
  name: string;
  color: string;
  /** Raw JSON text, or null for "no pattern, use plain color" — see parseCardBackground in card-backgrounds.ts. */
  background: string | null;
  /** Manual text-color override, or null for auto-contrast — see cardForegroundFor in card-backgrounds.ts. */
  text_color: string | null;
  kind: string;
  currency: string | null;
  is_default: boolean;
  archived: boolean;
  balance: string;
  /** False for a wallet shared with this user (see wallet_members) —
   * governs whether wallet-management actions (archive, delete, transfer,
   * set default, invite another member) should be offered at all;
   * viewing and posting transactions works the same either way. */
  is_owner: boolean;
  // Payment-card visuals, folded in from the old wallet_cards table — see
  // the wallets migration comments above. network null means "no card
  // look", i.e. render as a plain account.
  holder_name: string | null;
  last4: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  network: string | null;
  show_network_badge: boolean;
  badge_position: string;
  icon_color: string | null;
  show_chip: boolean;
  chip_color: string;
  chip_position: string;
  notes: string | null;
  show_balance: boolean;
  show_currency: boolean;
  show_card_number: boolean;
  show_name: boolean;
  show_holder_name: boolean;
  show_expiry: boolean;
};

// The full column list every wallet-returning query below selects — one
// place to keep in sync rather than four near-identical copies drifting.
const WALLET_COLUMNS = `
  w.id, w.name, w.color, w.background, w.text_color, w.kind, w.currency, w.is_default, w.archived,
  w.holder_name, w.last4, w.expiry_month, w.expiry_year, w.network,
  w.show_network_badge, w.badge_position, w.icon_color, w.show_chip, w.chip_color,
  w.chip_position, w.notes, w.show_balance, w.show_currency, w.show_card_number, w.show_name,
  w.show_holder_name, w.show_expiry
`;
const WALLET_BALANCE_EXPR = `
  (
    w.starting_balance + COALESCE((
      SELECT SUM(
        CASE
          WHEN e.type = 'income' THEN e.amount
          WHEN e.type = 'transfer' AND e.direction = 'in' THEN e.amount
          ELSE -e.amount
        END
      )
      FROM expenses e
      WHERE e.wallet_id = w.id AND e.created_at > w.starting_balance_set_at
    ), 0)
  )::text AS balance
`;

export async function listWallets(userId: number, opts: { includeArchived?: boolean } = {}): Promise<WalletRow[]> {
  await ensureSchema();
  const { rows } = opts.includeArchived
    ? await sql.query<WalletRow>(
        `SELECT ${WALLET_COLUMNS}, ${WALLET_BALANCE_EXPR}, (w.user_id = $1) AS is_owner
         FROM wallets w
         WHERE w.user_id = $1
            OR w.id IN (SELECT wallet_id FROM wallet_members WHERE user_id = $1 AND status = 'accepted')
         ORDER BY w.archived, w.sort_order, w.id;`,
        [userId],
      )
    : await sql.query<WalletRow>(
        `SELECT ${WALLET_COLUMNS}, ${WALLET_BALANCE_EXPR}, (w.user_id = $1) AS is_owner
         FROM wallets w
         WHERE (w.user_id = $1
            OR w.id IN (SELECT wallet_id FROM wallet_members WHERE user_id = $1 AND status = 'accepted'))
           AND w.archived = false
         ORDER BY w.sort_order, w.id;`,
        [userId],
      );
  return rows;
}

export async function createWallet(
  userId: number,
  input: {
    name: string;
    color: string;
    kind: string;
    currency?: string | null;
    background?: unknown;
    textColor?: string | null;
    holderName?: string | null;
    last4?: string | null;
    expiryMonth?: number | null;
    expiryYear?: number | null;
    network?: string | null;
    showNetworkBadge?: boolean;
    badgePosition?: string;
    iconColor?: string | null;
    showChip?: boolean;
    chipColor?: string;
    chipPosition?: string;
    notes?: string | null;
    showBalance?: boolean;
    showCurrency?: boolean;
    showCardNumber?: boolean;
    showName?: boolean;
    showHolderName?: boolean;
    showExpiry?: boolean;
  },
): Promise<WalletRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM wallets WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const backgroundJson = input.background ? JSON.stringify(input.background) : null;
  const showNetworkBadge = input.showNetworkBadge ?? true;
  const badgePosition = input.badgePosition ?? "topRight";
  const showChip = input.showChip ?? true;
  const chipColor = input.chipColor ?? "gold";
  const chipPosition = input.chipPosition ?? "middleLeft";
  const showBalance = input.showBalance ?? true;
  const showCurrency = input.showCurrency ?? true;
  const showCardNumber = input.showCardNumber ?? true;
  const showName = input.showName ?? true;
  const showHolderName = input.showHolderName ?? true;
  const showExpiry = input.showExpiry ?? true;
  const { rows } = await sql<{
    id: number;
    name: string;
    color: string;
    background: string | null;
    text_color: string | null;
    kind: string;
    currency: string | null;
    holder_name: string | null;
    last4: string | null;
    expiry_month: number | null;
    expiry_year: number | null;
    network: string | null;
    show_network_badge: boolean;
    badge_position: string;
    icon_color: string | null;
    show_chip: boolean;
    chip_color: string;
    chip_position: string;
    notes: string | null;
    show_balance: boolean;
    show_currency: boolean;
    show_card_number: boolean;
    show_name: boolean;
    show_holder_name: boolean;
    show_expiry: boolean;
  }>`
    INSERT INTO wallets (
      user_id, name, color, background, text_color, kind, currency, sort_order,
      holder_name, last4, expiry_month, expiry_year, network,
      show_network_badge, badge_position, icon_color, show_chip, chip_color, chip_position, notes,
      show_balance, show_currency, show_card_number, show_name, show_holder_name, show_expiry
    )
    VALUES (
      ${userId}, ${input.name}, ${input.color}, ${backgroundJson}, ${input.textColor ?? null}, ${input.kind}, ${input.currency ?? null}, ${nextSort},
      ${input.holderName ?? null}, ${input.last4 ?? null}, ${input.expiryMonth ?? null}, ${input.expiryYear ?? null}, ${input.network ?? null},
      ${showNetworkBadge}, ${badgePosition}, ${input.iconColor ?? null}, ${showChip}, ${chipColor}, ${chipPosition}, ${input.notes ?? null},
      ${showBalance}, ${showCurrency}, ${showCardNumber}, ${showName}, ${showHolderName}, ${showExpiry}
    )
    RETURNING
      id, name, color, background, text_color, kind, currency,
      holder_name, last4, expiry_month, expiry_year, network,
      show_network_badge, badge_position, icon_color, show_chip, chip_color, chip_position, notes,
      show_balance, show_currency, show_card_number, show_name, show_holder_name, show_expiry;
  `;
  return { ...rows[0], is_default: false, archived: false, balance: "0", is_owner: true };
}

export async function updateWallet(
  userId: number,
  id: number,
  input: {
    name?: string;
    color?: string;
    background?: unknown;
    textColor?: string | null;
    kind?: string;
    currency?: string | null;
    isDefault?: boolean;
    archived?: boolean;
    startingBalance?: number;
    holderName?: string | null;
    last4?: string | null;
    expiryMonth?: number | null;
    expiryYear?: number | null;
    network?: string | null;
    showNetworkBadge?: boolean;
    badgePosition?: string;
    iconColor?: string | null;
    showChip?: boolean;
    chipColor?: string;
    chipPosition?: string;
    notes?: string | null;
    showBalance?: boolean;
    showCurrency?: boolean;
    showCardNumber?: boolean;
    showName?: boolean;
    showHolderName?: boolean;
    showExpiry?: boolean;
  },
): Promise<WalletRow | { ok: false; error: string } | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<{
    name: string;
    color: string;
    background: string | null;
    text_color: string | null;
    kind: string;
    currency: string | null;
    is_default: boolean;
    archived: boolean;
    holder_name: string | null;
    last4: string | null;
    expiry_month: number | null;
    expiry_year: number | null;
    network: string | null;
    show_network_badge: boolean;
    badge_position: string;
    icon_color: string | null;
    show_chip: boolean;
    chip_color: string;
    chip_position: string;
    notes: string | null;
    show_balance: boolean;
    show_currency: boolean;
    show_card_number: boolean;
    show_name: boolean;
    show_holder_name: boolean;
    show_expiry: boolean;
  }>`
    SELECT
      name, color, background, text_color, kind, currency, is_default, archived,
      holder_name, last4, expiry_month, expiry_year, network,
      show_network_badge, badge_position, icon_color, show_chip, chip_color, chip_position, notes,
      show_balance, show_currency, show_card_number, show_name, show_holder_name, show_expiry
    FROM wallets WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const archiving = input.archived === true && !existing.archived;
  if (archiving) {
    const { rows: activeRows } = await sql<{ id: number }>`
      SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false AND id != ${id};
    `;
    if (activeRows.length === 0) {
      return { ok: false, error: "You need at least one active wallet — archive a different one first, or add a new wallet." };
    }
  }

  const newName = input.name?.trim() ?? existing.name;
  const newColor = input.color ?? existing.color;
  const newBackground = input.background !== undefined ? (input.background ? JSON.stringify(input.background) : null) : existing.background;
  const newTextColor = input.textColor !== undefined ? input.textColor : existing.text_color;
  const newKind = input.kind ?? existing.kind;
  const newCurrency = input.currency !== undefined ? input.currency : existing.currency;
  const newArchived = input.archived ?? existing.archived;
  const newHolderName = input.holderName !== undefined ? input.holderName : existing.holder_name;
  const newLast4 = input.last4 !== undefined ? input.last4 : existing.last4;
  const newExpiryMonth = input.expiryMonth !== undefined ? input.expiryMonth : existing.expiry_month;
  const newExpiryYear = input.expiryYear !== undefined ? input.expiryYear : existing.expiry_year;
  const newNetwork = input.network !== undefined ? input.network : existing.network;
  const newShowNetworkBadge = input.showNetworkBadge ?? existing.show_network_badge;
  const newBadgePosition = input.badgePosition ?? existing.badge_position;
  const newIconColor = input.iconColor !== undefined ? input.iconColor : existing.icon_color;
  const newShowChip = input.showChip ?? existing.show_chip;
  const newChipColor = input.chipColor ?? existing.chip_color;
  const newChipPosition = input.chipPosition ?? existing.chip_position;
  const newNotes = input.notes !== undefined ? input.notes : existing.notes;
  const newShowBalance = input.showBalance ?? existing.show_balance;
  const newShowCurrency = input.showCurrency ?? existing.show_currency;
  const newShowCardNumber = input.showCardNumber ?? existing.show_card_number;
  const newShowName = input.showName ?? existing.show_name;
  const newShowHolderName = input.showHolderName ?? existing.show_holder_name;
  const newShowExpiry = input.showExpiry ?? existing.show_expiry;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    if (input.startingBalance !== undefined) {
      await client.sql`
        UPDATE wallets
        SET name = ${newName}, color = ${newColor}, background = ${newBackground}, text_color = ${newTextColor}, kind = ${newKind}, currency = ${newCurrency},
            archived = ${newArchived}, starting_balance = ${input.startingBalance}, starting_balance_set_at = now(),
            holder_name = ${newHolderName}, last4 = ${newLast4}, expiry_month = ${newExpiryMonth}, expiry_year = ${newExpiryYear}, network = ${newNetwork},
            show_network_badge = ${newShowNetworkBadge}, badge_position = ${newBadgePosition}, icon_color = ${newIconColor},
            show_chip = ${newShowChip}, chip_color = ${newChipColor}, chip_position = ${newChipPosition}, notes = ${newNotes},
            show_balance = ${newShowBalance}, show_currency = ${newShowCurrency}, show_card_number = ${newShowCardNumber}, show_name = ${newShowName},
            show_holder_name = ${newShowHolderName}, show_expiry = ${newShowExpiry}
        WHERE id = ${id} AND user_id = ${userId};
      `;
    } else {
      await client.sql`
        UPDATE wallets
        SET name = ${newName}, color = ${newColor}, background = ${newBackground}, text_color = ${newTextColor}, kind = ${newKind}, currency = ${newCurrency}, archived = ${newArchived},
            holder_name = ${newHolderName}, last4 = ${newLast4}, expiry_month = ${newExpiryMonth}, expiry_year = ${newExpiryYear}, network = ${newNetwork},
            show_network_badge = ${newShowNetworkBadge}, badge_position = ${newBadgePosition}, icon_color = ${newIconColor},
            show_chip = ${newShowChip}, chip_color = ${newChipColor}, chip_position = ${newChipPosition}, notes = ${newNotes},
            show_balance = ${newShowBalance}, show_currency = ${newShowCurrency}, show_card_number = ${newShowCardNumber}, show_name = ${newShowName},
            show_holder_name = ${newShowHolderName}, show_expiry = ${newShowExpiry}
        WHERE id = ${id} AND user_id = ${userId};
      `;
    }

    if (input.isDefault === true) {
      await client.sql`UPDATE wallets SET is_default = false WHERE user_id = ${userId} AND id != ${id};`;
      await client.sql`UPDATE wallets SET is_default = true WHERE id = ${id} AND user_id = ${userId};`;
    }

    // Archiving the default wallet hands default status to the wallet that
    // inherited its expenses in an archive-triggered reassignment elsewhere,
    // or — since archiving doesn't move expenses — simply to the next active
    // wallet, so resolveWalletId always has a non-archived default to fall
    // back to.
    if (archiving && existing.is_default) {
      await client.sql`UPDATE wallets SET is_default = false WHERE id = ${id} AND user_id = ${userId};`;
      await client.sql`
        UPDATE wallets SET is_default = true
        WHERE id = (SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false AND id != ${id} ORDER BY sort_order, id LIMIT 1);
      `;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await sql.query<WalletRow>(
    `SELECT ${WALLET_COLUMNS}, ${WALLET_BALANCE_EXPR}, true AS is_owner
     FROM wallets w
     WHERE w.id = $1 AND w.user_id = $2;`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function deleteWallet(
  userId: number,
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  const { rows: countRows } = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM wallets WHERE user_id = ${userId};`;
  if ((countRows[0]?.n ?? 0) <= 1) {
    return { ok: false, error: "You need at least one wallet." };
  }

  const { rows: targetRows } = await sql<{ is_default: boolean }>`
    SELECT is_default FROM wallets WHERE id = ${id} AND user_id = ${userId};
  `;
  if (!targetRows[0]) {
    return { ok: false, error: "Not found." };
  }

  const { rows: fallbackRows } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND id != ${id} AND archived = false ORDER BY sort_order, id LIMIT 1;
  `;
  const fallbackId = fallbackRows[0]?.id;
  if (!fallbackId) {
    return { ok: false, error: "You need at least one active wallet." };
  }

  await sql`UPDATE expenses SET wallet_id = ${fallbackId} WHERE wallet_id = ${id} AND user_id = ${userId};`;
  await sql`DELETE FROM wallets WHERE id = ${id} AND user_id = ${userId};`;
  if (targetRows[0].is_default) {
    await sql`UPDATE wallets SET is_default = true WHERE id = ${fallbackId} AND user_id = ${userId};`;
  }
  return { ok: true };
}

// Same adjacent-swap approach as moveRecurringRule/moveSavingsGoal. Scoped
// to wallets sharing the same archived status as the one being moved — the
// Settings UI renders active and archived wallets as two separate lists
// (see WalletManager.tsx), so "up"/"down" needs to swap within whichever
// list is actually showing on screen, not the raw combined sort order.
export async function moveWallet(userId: number, id: number, direction: "up" | "down"): Promise<void> {
  await ensureSchema();
  const { rows: targetRows } = await sql<{ archived: boolean }>`
    SELECT archived FROM wallets WHERE id = ${id} AND user_id = ${userId};
  `;
  if (!targetRows[0]) return;
  const { rows } = await sql<{ id: number; sort_order: number }>`
    SELECT id, sort_order FROM wallets
    WHERE user_id = ${userId} AND archived = ${targetRows[0].archived}
    ORDER BY sort_order, id;
  `;
  const idx = rows.findIndex((r) => r.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.sql`UPDATE wallets SET sort_order = ${b.sort_order} WHERE id = ${a.id} AND user_id = ${userId};`;
    await client.sql`UPDATE wallets SET sort_order = ${a.sort_order} WHERE id = ${b.id} AND user_id = ${userId};`;
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Sets an explicit full order in one shot — powers drag-to-reorder on the
// Wallet page's card stack/grid (see useReorderableList.ts), where the
// user can drop an item anywhere rather than only ever swapping one step
// up/down (moveWallet, above). `orderedIds` must be exactly the set of
// this user's active (non-archived) wallet ids — anything else (an id
// that isn't theirs, isn't active, or a partial/incomplete list) is
// rejected outright rather than silently reordering a subset, since a
// stale client-side list (e.g. a wallet archived in another tab
// mid-drag) could otherwise scramble sort_order for wallets the request
// never even mentioned.
export async function reorderWallets(userId: number, orderedIds: number[]): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  const { rows } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false ORDER BY sort_order, id;
  `;
  const actualIds = new Set(rows.map((r) => r.id));
  const givenIds = new Set(orderedIds);
  if (givenIds.size !== orderedIds.length || actualIds.size !== givenIds.size || [...actualIds].some((id) => !givenIds.has(id))) {
    return { ok: false, error: "That list of wallets is out of date — refresh and try again." };
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.sql`UPDATE wallets SET sort_order = ${i} WHERE id = ${orderedIds[i]} AND user_id = ${userId};`;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { ok: true };
}

// ---- Card templates (user-submitted "premade card" designs) ---------------
// Any user can submit a card's look (background + colors — the same shape
// WalletCardShape/AccountCardShape already render) for review; once
// approved by the admin (see isAdminUser in admin.ts), it becomes
// selectable by everyone via listApprovedCardTemplates, same as the
// built-in CARD_PATTERNS gallery. No balance/network/holder/etc — a
// template is purely the visual skin, applied on top of whatever wallet
// the picking user is editing.

export type CardTemplateRow = {
  id: number;
  submitted_by: number | null;
  submitted_by_username: string | null;
  name: string;
  color: string;
  background: string | null;
  text_color: string | null;
  // NULL means "don't touch this toggle" — see the force_* column comments
  // in ensureSchema above.
  force_show_name: boolean | null;
  force_show_network_badge: boolean | null;
  force_show_chip: boolean | null;
  force_show_card_number: boolean | null;
  force_show_balance: boolean | null;
  force_show_currency: boolean | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

// Shared by every query below so the six force_* columns can't drift out
// of one of them the way the wallets-merge fields once nearly did (see
// WALLET_COLUMNS' own comment) — `ct.` for the SELECT queries (aliased
// against the users join), bare column names for INSERT/UPDATE...RETURNING
// where there's no alias to strip.
const CARD_TEMPLATE_COLUMNS =
  "id, submitted_by, name, color, background, text_color, force_show_name, force_show_network_badge, force_show_chip, force_show_card_number, force_show_balance, force_show_currency, status, created_at, reviewed_at";

export async function createCardTemplate(
  userId: number,
  input: {
    name: string;
    color: string;
    background?: unknown;
    textColor?: string | null;
    forceShowName?: boolean | null;
    forceShowNetworkBadge?: boolean | null;
    forceShowChip?: boolean | null;
    forceShowCardNumber?: boolean | null;
    forceShowBalance?: boolean | null;
    forceShowCurrency?: boolean | null;
  },
): Promise<CardTemplateRow> {
  await ensureSchema();
  const backgroundJson = input.background ? JSON.stringify(input.background) : null;
  const { rows } = await sql.query<CardTemplateRow>(
    `INSERT INTO card_templates (
       submitted_by, name, color, background, text_color,
       force_show_name, force_show_network_badge, force_show_chip, force_show_card_number, force_show_balance, force_show_currency,
       status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
     RETURNING ${CARD_TEMPLATE_COLUMNS}, NULL AS submitted_by_username;`,
    [
      userId,
      input.name,
      input.color,
      backgroundJson,
      input.textColor ?? null,
      input.forceShowName ?? null,
      input.forceShowNetworkBadge ?? null,
      input.forceShowChip ?? null,
      input.forceShowCardNumber ?? null,
      input.forceShowBalance ?? null,
      input.forceShowCurrency ?? null,
    ],
  );
  return rows[0];
}

// Public — every user picking a premade card sees the same approved list,
// newest-approved first.
export async function listApprovedCardTemplates(): Promise<CardTemplateRow[]> {
  await ensureSchema();
  const { rows } = await sql.query<CardTemplateRow>(
    `SELECT ${CARD_TEMPLATE_COLUMNS.split(", ").map((c) => "ct." + c).join(", ")}, u.username AS submitted_by_username
     FROM card_templates ct
     LEFT JOIN users u ON u.id = ct.submitted_by
     WHERE ct.status = 'approved'
     ORDER BY ct.reviewed_at DESC NULLS LAST, ct.created_at DESC;`,
  );
  return rows;
}

// Admin-only — every template regardless of status, for the "view/edit/
// remove existing templates" management page (which filters/sorts by
// status client-side rather than needing a separate pending-only query).
export async function listAllCardTemplates(): Promise<CardTemplateRow[]> {
  await ensureSchema();
  const { rows } = await sql.query<CardTemplateRow>(
    `SELECT ${CARD_TEMPLATE_COLUMNS.split(", ").map((c) => "ct." + c).join(", ")}, u.username AS submitted_by_username
     FROM card_templates ct
     LEFT JOIN users u ON u.id = ct.submitted_by
     ORDER BY ct.created_at DESC;`,
  );
  return rows;
}

// Admin-only full edit — every field optional/partial, used both for the
// quick approve/reject buttons (just `{status}`) and the full edit form.
// Setting `status` bumps reviewed_at regardless of the template's current
// status (re-approving a rejected one, or editing an already-approved
// one, are both just "the admin decided this again") — this is a
// single-admin management surface, not a guarded review queue, so there's
// no "only from pending" restriction to protect against a race.
export async function updateCardTemplate(
  id: number,
  input: {
    name?: string;
    color?: string;
    background?: unknown;
    textColor?: string | null;
    forceShowName?: boolean | null;
    forceShowNetworkBadge?: boolean | null;
    forceShowChip?: boolean | null;
    forceShowCardNumber?: boolean | null;
    forceShowBalance?: boolean | null;
    forceShowCurrency?: boolean | null;
    status?: "pending" | "approved" | "rejected";
  },
): Promise<CardTemplateRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<{
    name: string;
    color: string;
    background: string | null;
    text_color: string | null;
    force_show_name: boolean | null;
    force_show_network_badge: boolean | null;
    force_show_chip: boolean | null;
    force_show_card_number: boolean | null;
    force_show_balance: boolean | null;
    force_show_currency: boolean | null;
    status: "pending" | "approved" | "rejected";
  }>`
    SELECT name, color, background, text_color,
           force_show_name, force_show_network_badge, force_show_chip, force_show_card_number, force_show_balance, force_show_currency,
           status
    FROM card_templates WHERE id = ${id};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const newName = input.name?.trim() ?? existing.name;
  const newColor = input.color ?? existing.color;
  const newBackground = input.background !== undefined ? (input.background ? JSON.stringify(input.background) : null) : existing.background;
  const newTextColor = input.textColor !== undefined ? input.textColor : existing.text_color;
  const newForceShowName = input.forceShowName !== undefined ? input.forceShowName : existing.force_show_name;
  const newForceShowNetworkBadge = input.forceShowNetworkBadge !== undefined ? input.forceShowNetworkBadge : existing.force_show_network_badge;
  const newForceShowChip = input.forceShowChip !== undefined ? input.forceShowChip : existing.force_show_chip;
  const newForceShowCardNumber = input.forceShowCardNumber !== undefined ? input.forceShowCardNumber : existing.force_show_card_number;
  const newForceShowBalance = input.forceShowBalance !== undefined ? input.forceShowBalance : existing.force_show_balance;
  const newForceShowCurrency = input.forceShowCurrency !== undefined ? input.forceShowCurrency : existing.force_show_currency;
  const newStatus = input.status ?? existing.status;
  const bumpReviewedAt = input.status !== undefined;

  const { rows } = await sql.query<CardTemplateRow>(
    `UPDATE card_templates
     SET name = $1, color = $2, background = $3, text_color = $4,
         force_show_name = $5, force_show_network_badge = $6, force_show_chip = $7, force_show_card_number = $8, force_show_balance = $9, force_show_currency = $10,
         status = $11, reviewed_at = ${bumpReviewedAt ? "now()" : "reviewed_at"}
     WHERE id = $12
     RETURNING ${CARD_TEMPLATE_COLUMNS}, NULL AS submitted_by_username;`,
    [
      newName,
      newColor,
      newBackground,
      newTextColor,
      newForceShowName,
      newForceShowNetworkBadge,
      newForceShowChip,
      newForceShowCardNumber,
      newForceShowBalance,
      newForceShowCurrency,
      newStatus,
      id,
    ],
  );
  return rows[0] ?? null;
}

// Admin-only, permanent — a template isn't referenced by any wallet (only
// its background/colors get *copied* onto one when picked, see
// PremadeCardPicker), so there's nothing else to clean up.
export async function deleteCardTemplate(id: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ id: number }>`DELETE FROM card_templates WHERE id = ${id} RETURNING id;`;
  return rows.length > 0;
}

// ---- Wallet members (shared/household wallets) ----------------------------
// See the schema-v27 comment above for the design: ownership stays a
// single wallets.user_id column; this table only adds view+post access
// on top of it for invited friends.

export type WalletMemberRow = {
  id: number;
  wallet_id: number;
  user_id: number;
  username: string;
  status: "pending" | "accepted" | "declined";
};

export async function listWalletMembers(userId: number, walletId: number): Promise<WalletMemberRow[]> {
  await ensureSchema();
  const { rows: ownedRows } = await sql`SELECT 1 FROM wallets WHERE id = ${walletId} AND user_id = ${userId};`;
  if (!ownedRows[0]) return [];
  const { rows } = await sql<WalletMemberRow>`
    SELECT wm.id, wm.wallet_id, wm.user_id, u.username, wm.status
    FROM wallet_members wm
    JOIN users u ON u.id = wm.user_id
    WHERE wm.wallet_id = ${walletId}
    ORDER BY wm.id;
  `;
  return rows;
}

// Only the owning wallet's own account can invite — a member can't
// re-share a wallet they don't own onward to someone else.
export async function inviteWalletMember(
  userId: number,
  walletId: number,
  friendId: number,
): Promise<{ error: string } | { id: number }> {
  await ensureSchema();
  const { rows: ownedRows } = await sql`SELECT 1 FROM wallets WHERE id = ${walletId} AND user_id = ${userId};`;
  if (!ownedRows[0]) return { error: "That wallet could not be found." };
  if (friendId === userId) return { error: "You can't share a wallet with yourself." };
  if (!(await areFriends(userId, friendId))) return { error: "You can only share a wallet with a friend." };
  const { rows } = await sql<{ id: number }>`
    INSERT INTO wallet_members (wallet_id, user_id, status)
    VALUES (${walletId}, ${friendId}, 'pending')
    ON CONFLICT (wallet_id, user_id) DO UPDATE SET status = 'pending'
    RETURNING id;
  `;
  return { id: rows[0].id };
}

export type PendingWalletInvite = { id: number; wallet_id: number; wallet_name: string; owner_username: string };

// Incoming invites for the signed-in user to respond to — the wallet-
// share equivalent of listFriendRequests.
export async function listMyPendingWalletInvites(userId: number): Promise<PendingWalletInvite[]> {
  await ensureSchema();
  const { rows } = await sql<PendingWalletInvite>`
    SELECT wm.id, wm.wallet_id, w.name AS wallet_name, u.username AS owner_username
    FROM wallet_members wm
    JOIN wallets w ON w.id = wm.wallet_id
    JOIN users u ON u.id = w.user_id
    WHERE wm.user_id = ${userId} AND wm.status = 'pending'
    ORDER BY wm.invited_at DESC;
  `;
  return rows;
}

export async function respondToWalletInvite(userId: number, memberId: number, accept: boolean): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE wallet_members SET status = ${accept ? "accepted" : "declined"}
    WHERE id = ${memberId} AND user_id = ${userId} AND status = 'pending';
  `;
  return (rowCount ?? 0) > 0;
}

// The owner can remove any member; a member can remove themselves
// (leaving the shared wallet) — either way it's just deleting their row.
export async function removeWalletMember(userId: number, memberId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    DELETE FROM wallet_members wm
    USING wallets w
    WHERE wm.id = ${memberId}
      AND wm.wallet_id = w.id
      AND (wm.user_id = ${userId} OR w.user_id = ${userId});
  `;
  return (rowCount ?? 0) > 0;
}

// Lets a member leave a shared wallet by wallet id, without needing to
// know their own wallet_members row id — the natural shape for "Leave"
// on a wallet the client only has the wallet's id for.
export async function leaveSharedWallet(userId: number, walletId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    DELETE FROM wallet_members WHERE wallet_id = ${walletId} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function seedDefaultWalletForUser(userId: number): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO wallets (user_id, name, color, sort_order, is_default)
    SELECT ${userId}, 'Cash', 'slate', 0, true
    WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = ${userId});
  `;
}

// The Dashboard's "Remaining" is derived from wallets, not tracked
// separately — it's always exactly the sum of every wallet's own balance
// (see listWallets), so the two figures can never drift apart.
export async function getRemaining(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ remaining: string }>`
    SELECT COALESCE(SUM(
      w.starting_balance + COALESCE((
        SELECT SUM(
          CASE
            WHEN e.type = 'income' THEN e.amount
            WHEN e.type = 'transfer' AND e.direction = 'in' THEN e.amount
            ELSE -e.amount
          END
        )
        FROM expenses e
        WHERE e.wallet_id = w.id AND e.created_at > w.starting_balance_set_at
      ), 0)
    ), 0)::text AS remaining
    FROM wallets w
    WHERE w.user_id = ${userId} AND w.archived = false;
  `;
  return rows[0] ? Number(rows[0].remaining) : 0;
}

async function getWalletBalance(walletId: number): Promise<number> {
  const { rows } = await sql<{ balance: string }>`
    SELECT (
      w.starting_balance + COALESCE((
        SELECT SUM(
          CASE
            WHEN e.type = 'income' THEN e.amount
            WHEN e.type = 'transfer' AND e.direction = 'in' THEN e.amount
            ELSE -e.amount
          END
        )
        FROM expenses e
        WHERE e.wallet_id = w.id AND e.created_at > w.starting_balance_set_at
      ), 0)
    )::text AS balance
    FROM wallets w
    WHERE w.id = ${walletId};
  `;
  return rows[0] ? Number(rows[0].balance) : 0;
}

// Editing the Dashboard's overall "Remaining" nudges the default wallet by
// whatever delta is needed to bring the total to the requested amount,
// rather than trying to guess how to split an absolute figure across
// multiple wallets.
export async function setRemaining(userId: number, amount: number): Promise<number> {
  await ensureSchema();
  const { rows: walletRows } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false ORDER BY is_default DESC, sort_order, id LIMIT 1;
  `;
  const targetId = walletRows[0]?.id;
  if (!targetId) return amount;

  const [current, targetBalance] = await Promise.all([getRemaining(userId), getWalletBalance(targetId)]);
  const delta = amount - current;
  await sql`
    UPDATE wallets
    SET starting_balance = ${targetBalance + delta}, starting_balance_set_at = now()
    WHERE id = ${targetId};
  `;
  return amount;
}

export async function getCurrency(userId: number): Promise<string> {
  await ensureSchema();
  const { rows } = await sql<{ currency: string }>`SELECT currency FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.currency ?? "USD";
}

export async function setCurrency(userId: number, code: string): Promise<string> {
  await ensureSchema();
  await sql`UPDATE app_settings SET currency = ${code} WHERE user_id = ${userId};`;
  return code;
}

export async function getLanguage(userId: number): Promise<string> {
  await ensureSchema();
  const { rows } = await sql<{ language: string }>`SELECT language FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.language ?? "en";
}

export async function setLanguage(userId: number, code: string): Promise<string> {
  await ensureSchema();
  await sql`UPDATE app_settings SET language = ${code} WHERE user_id = ${userId};`;
  return code;
}

export async function getAutoConvertCurrency(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ auto_convert_currency: boolean }>`
    SELECT auto_convert_currency FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.auto_convert_currency ?? false;
}

export async function setAutoConvertCurrency(userId: number, enabled: boolean): Promise<boolean> {
  await ensureSchema();
  await sql`UPDATE app_settings SET auto_convert_currency = ${enabled} WHERE user_id = ${userId};`;
  return enabled;
}

export async function getConvertWalletBalances(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ convert_wallet_balances: boolean }>`
    SELECT convert_wallet_balances FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.convert_wallet_balances ?? false;
}

export async function setConvertWalletBalances(userId: number, enabled: boolean): Promise<boolean> {
  await ensureSchema();
  await sql`UPDATE app_settings SET convert_wallet_balances = ${enabled} WHERE user_id = ${userId};`;
  return enabled;
}

export async function getNotifyRecurringEmail(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ notify_recurring_email: boolean }>`
    SELECT notify_recurring_email FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.notify_recurring_email ?? false;
}

export async function setNotifyRecurringEmail(userId: number, enabled: boolean): Promise<boolean> {
  await ensureSchema();
  await sql`UPDATE app_settings SET notify_recurring_email = ${enabled} WHERE user_id = ${userId};`;
  return enabled;
}

export async function getNotifyBudgetEmail(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ notify_budget_email: boolean }>`
    SELECT notify_budget_email FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.notify_budget_email ?? false;
}

export async function setNotifyBudgetEmail(userId: number, enabled: boolean): Promise<boolean> {
  await ensureSchema();
  await sql`UPDATE app_settings SET notify_budget_email = ${enabled} WHERE user_id = ${userId};`;
  return enabled;
}

// When enabled, converts each wallet's balance from its own currency label
// (if set and different from the app default) into the app's default
// currency before summing — so a mixed-currency Remaining/net-worth figure
// is an actual total rather than raw addition across currencies. Falls back
// to the plain (unconverted) sum if disabled, if a wallet has no currency
// label, or if a conversion lookup fails.
export async function getDashboardWidgets(userId: number): Promise<DashboardWidgetInstance[]> {
  await ensureSchema();
  const { rows } = await sql<{ dashboard_widgets: string }>`
    SELECT dashboard_widgets FROM app_settings WHERE user_id = ${userId};
  `;
  let parsed: unknown = null;
  try {
    parsed = rows[0] ? JSON.parse(rows[0].dashboard_widgets) : null;
  } catch {
    parsed = null;
  }
  return normalizeDashboardWidgets(parsed);
}

export async function setDashboardWidgets(
  userId: number,
  widgets: DashboardWidgetInstance[],
): Promise<DashboardWidgetInstance[]> {
  await ensureSchema();
  const normalized = normalizeDashboardWidgets(widgets);
  await sql`
    UPDATE app_settings SET dashboard_widgets = ${JSON.stringify(normalized)} WHERE user_id = ${userId};
  `;
  return normalized;
}

export type CalendarSettings = {
  weekStartDay: number;
  monthStartDay: number;
  biweeklyAnchorDate: string | null;
  defaultView: string;
  timezone: string;
  showWeekNumbers: boolean;
  alternateCalendar: string;
};

export async function getCalendarSettings(userId: number): Promise<CalendarSettings> {
  await ensureSchema();
  const { rows } = await sql<{
    week_start_day: number;
    month_start_day: number;
    biweekly_anchor_date: string | null;
    default_view: string;
    timezone: string;
    show_week_numbers: boolean;
    alternate_calendar: string;
  }>`
    SELECT week_start_day, month_start_day, biweekly_anchor_date, default_view, timezone, show_week_numbers, alternate_calendar
    FROM app_settings WHERE user_id = ${userId};
  `;
  const row = rows[0];
  return {
    weekStartDay: row?.week_start_day ?? 0,
    monthStartDay: row?.month_start_day ?? 1,
    biweeklyAnchorDate: row?.biweekly_anchor_date ?? null,
    defaultView: row?.default_view ?? "today",
    timezone: row?.timezone ?? "auto",
    showWeekNumbers: row?.show_week_numbers ?? false,
    alternateCalendar: row?.alternate_calendar ?? "none",
  };
}

export async function setCalendarSettings(
  userId: number,
  patch: Partial<CalendarSettings>,
): Promise<CalendarSettings> {
  await ensureSchema();
  if (patch.weekStartDay !== undefined) {
    await sql`UPDATE app_settings SET week_start_day = ${patch.weekStartDay} WHERE user_id = ${userId};`;
  }
  if (patch.monthStartDay !== undefined) {
    await sql`UPDATE app_settings SET month_start_day = ${patch.monthStartDay} WHERE user_id = ${userId};`;
  }
  if (patch.biweeklyAnchorDate !== undefined) {
    await sql`UPDATE app_settings SET biweekly_anchor_date = ${patch.biweeklyAnchorDate} WHERE user_id = ${userId};`;
  }
  if (patch.defaultView !== undefined) {
    await sql`UPDATE app_settings SET default_view = ${patch.defaultView} WHERE user_id = ${userId};`;
  }
  if (patch.timezone !== undefined) {
    await sql`UPDATE app_settings SET timezone = ${patch.timezone} WHERE user_id = ${userId};`;
  }
  if (patch.showWeekNumbers !== undefined) {
    await sql`UPDATE app_settings SET show_week_numbers = ${patch.showWeekNumbers} WHERE user_id = ${userId};`;
  }
  if (patch.alternateCalendar !== undefined) {
    await sql`UPDATE app_settings SET alternate_calendar = ${patch.alternateCalendar} WHERE user_id = ${userId};`;
  }
  return getCalendarSettings(userId);
}

// Which wallet Activities' balance card is scoped to by default — null
// means "All wallets". Returning null both when unset and when the chosen
// wallet no longer exists (ON DELETE SET NULL already handles the latter
// at the DB level, this is just the read side).
export async function getActivitiesDefaultWalletId(userId: number): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ activities_default_wallet_id: number | null }>`
    SELECT activities_default_wallet_id FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.activities_default_wallet_id ?? null;
}

export async function setActivitiesDefaultWalletId(userId: number, walletId: number | null): Promise<void> {
  await ensureSchema();
  if (walletId !== null) {
    const { rows } = await sql`SELECT 1 FROM wallets WHERE id = ${walletId} AND user_id = ${userId};`;
    if (rows.length === 0) {
      throw new Error("That wallet doesn't exist.");
    }
  }
  await sql`UPDATE app_settings SET activities_default_wallet_id = ${walletId} WHERE user_id = ${userId};`;
}

// Biometric app-lock — see AppLockGate.tsx/AppLockSettingsPanel.tsx.
export async function getAppLockEnabled(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ applock_enabled: boolean }>`SELECT applock_enabled FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.applock_enabled ?? false;
}

export async function setAppLockEnabled(userId: number, enabled: boolean): Promise<void> {
  await ensureSchema();
  await sql`UPDATE app_settings SET applock_enabled = ${enabled} WHERE user_id = ${userId};`;
}

export async function getAppLockTimeoutSeconds(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ applock_timeout_seconds: number }>`SELECT applock_timeout_seconds FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.applock_timeout_seconds ?? 0;
}

export async function setAppLockTimeoutSeconds(userId: number, seconds: number): Promise<void> {
  await ensureSchema();
  await sql`UPDATE app_settings SET applock_timeout_seconds = ${seconds} WHERE user_id = ${userId};`;
}

export async function getAppLockPinHash(userId: number): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql<{ applock_pin_hash: string | null }>`SELECT applock_pin_hash FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.applock_pin_hash ?? null;
}

export async function setAppLockPinHash(userId: number, hash: string | null, length: number | null): Promise<void> {
  await ensureSchema();
  await sql`UPDATE app_settings SET applock_pin_hash = ${hash}, applock_pin_length = ${length} WHERE user_id = ${userId};`;
}

export async function getAppLockPinLength(userId: number): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ applock_pin_length: number | null }>`SELECT applock_pin_length FROM app_settings WHERE user_id = ${userId};`;
  return rows[0]?.applock_pin_length ?? null;
}

export type WebauthnCredentialRow = {
  id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  device_label: string | null;
  transports: string | null;
  created_at: string;
  last_used_at: string | null;
};

export async function listWebauthnCredentials(userId: number): Promise<WebauthnCredentialRow[]> {
  await ensureSchema();
  const { rows } = await sql<WebauthnCredentialRow>`
    SELECT id, credential_id, public_key, counter, device_label, transports, created_at::text, last_used_at::text
    FROM webauthn_credentials WHERE user_id = ${userId} ORDER BY created_at;
  `;
  return rows;
}

export async function getWebauthnCredentialById(credentialId: string): Promise<(WebauthnCredentialRow & { user_id: number }) | null> {
  await ensureSchema();
  const { rows } = await sql<WebauthnCredentialRow & { user_id: number }>`
    SELECT id, user_id, credential_id, public_key, counter, device_label, transports, created_at::text, last_used_at::text
    FROM webauthn_credentials WHERE credential_id = ${credentialId};
  `;
  return rows[0] ?? null;
}

export async function createWebauthnCredential(
  userId: number,
  credentialId: string,
  publicKey: string,
  counter: number,
  transports: string[],
  deviceLabel: string | null,
): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports, device_label)
    VALUES (${userId}, ${credentialId}, ${publicKey}, ${counter}, ${JSON.stringify(transports)}, ${deviceLabel});
  `;
}

export async function updateWebauthnCredentialCounter(credentialId: string, counter: number): Promise<void> {
  await ensureSchema();
  await sql`UPDATE webauthn_credentials SET counter = ${counter}, last_used_at = now() WHERE credential_id = ${credentialId};`;
}

export async function deleteWebauthnCredential(userId: number, id: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM webauthn_credentials WHERE id = ${id} AND user_id = ${userId};`;
}

// Safety net, not real pagination: every current caller (Dashboard, Activities,
// Settings, CSV export) still expects "all of it" and does its own client-side
// filtering/aggregation over the full array, so this only guards against a
// single pathological account's history growing large enough to blow up query/
// memory cost — it's far above what any real usage hits today. True pagination
// would mean moving Activities' search/filter server-side, which is a bigger,
// separate redesign.
const MAX_LISTED_EXPENSES = 10_000;

export async function listExpenses(userId: number): Promise<Expense[]> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    SELECT
      e.id,
      e.type,
      e.direction,
      to_char(e.date, 'YYYY-MM-DD') AS date,
      e.amount::text AS amount,
      e.merchant,
      e.category,
      e.notes,
      e.tags,
      (e.receipt_image IS NOT NULL OR EXISTS (SELECT 1 FROM expense_receipts er WHERE er.expense_id = e.id)) AS has_receipt,
      e.wallet_id,
      w.name AS wallet_name,
      e.split_group_id
    FROM expenses e
    LEFT JOIN wallets w ON w.id = e.wallet_id
    WHERE e.user_id = ${userId}
       OR e.wallet_id IN (SELECT id FROM wallets WHERE user_id = ${userId})
       OR e.wallet_id IN (SELECT wallet_id FROM wallet_members WHERE user_id = ${userId} AND status = 'accepted')
    ORDER BY e.date DESC, e.id DESC
    LIMIT ${MAX_LISTED_EXPENSES};
  `;
  return rows;
}

// Powers the "Latest Transactions" list on a wallet's detail view (see
// AccountDetail.tsx) — a small, wallet-scoped, capped slice rather than
// making the client fetch and filter the full (up to 10,000-row) list
// above just to show a handful of rows.
export async function listRecentWalletExpenses(userId: number, walletId: number, limit: number): Promise<Expense[]> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    SELECT
      e.id,
      e.type,
      e.direction,
      to_char(e.date, 'YYYY-MM-DD') AS date,
      e.amount::text AS amount,
      e.merchant,
      e.category,
      e.notes,
      e.tags,
      (e.receipt_image IS NOT NULL OR EXISTS (SELECT 1 FROM expense_receipts er WHERE er.expense_id = e.id)) AS has_receipt,
      e.wallet_id,
      w.name AS wallet_name,
      e.split_group_id
    FROM expenses e
    LEFT JOIN wallets w ON w.id = e.wallet_id
    WHERE e.wallet_id = ${walletId}
      AND (
        w.user_id = ${userId}
        OR e.wallet_id IN (SELECT wallet_id FROM wallet_members WHERE user_id = ${userId} AND status = 'accepted')
      )
    ORDER BY e.date DESC, e.id DESC
    LIMIT ${limit};
  `;
  return rows;
}

// Powers the merchant-field autocomplete in ExpenseForm.tsx — every
// merchant the user has typed before, most-recently-used first, so
// retyping "Starbucks" for the tenth time is one tap instead of a retype.
export async function listDistinctMerchants(userId: number): Promise<string[]> {
  await ensureSchema();
  const { rows } = await sql<{ merchant: string }>`
    SELECT merchant, MAX(date) AS last_used
    FROM expenses
    WHERE user_id = ${userId}
    GROUP BY merchant
    ORDER BY last_used DESC
    LIMIT 200;
  `;
  return rows.map((r) => r.merchant);
}

export type TagCount = { name: string; count: number };

export async function listTags(userId: number): Promise<TagCount[]> {
  await ensureSchema();
  const { rows } = await sql<{ tag: string; count: number }>`
    SELECT tag, COUNT(*)::int AS count
    FROM expenses, unnest(tags) AS tag
    WHERE user_id = ${userId}
    GROUP BY tag
    ORDER BY tag ASC;
  `;
  return rows.map((r) => ({ name: r.tag, count: r.count }));
}

export async function renameTag(userId: number, oldName: string, newName: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE expenses
    SET tags = (
      SELECT array_agg(DISTINCT CASE WHEN t = ${oldName} THEN ${newName} ELSE t END)
      FROM unnest(tags) AS t
    )
    WHERE user_id = ${userId} AND ${oldName} = ANY(tags);
  `;
}

export async function deleteTag(userId: number, name: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE expenses
    SET tags = array_remove(tags, ${name})
    WHERE user_id = ${userId} AND ${name} = ANY(tags);
  `;
}

// Resolves an expense's wallet: the caller's chosen wallet if it's actually
// theirs, otherwise their first (default) wallet.
async function resolveWalletId(userId: number, walletId: number | null | undefined): Promise<number | null> {
  if (walletId !== undefined && walletId !== null) {
    // Accepts the caller's own wallet, or a wallet they're an accepted
    // member of (shared/household wallets — see wallet_members).
    const { rows } = await sql<{ id: number }>`
      SELECT id FROM wallets WHERE id = ${walletId} AND (
        user_id = ${userId}
        OR id IN (SELECT wallet_id FROM wallet_members WHERE user_id = ${userId} AND status = 'accepted')
      );
    `;
    if (rows[0]) return rows[0].id;
  }
  const { rows: fallback } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false ORDER BY is_default DESC, sort_order, id LIMIT 1;
  `;
  return fallback[0]?.id ?? null;
}

export type PossibleDuplicateExpense = { id: number; date: string; amount: string; merchant: string };

// A same-day, same-merchant (case-insensitive), same-amount transaction
// already on file — surfaced as a non-blocking warning before create
// (see the `confirmDuplicate` flow in api/expenses/route.ts), not a hard
// block: a genuine repeat purchase (coffee twice a day) must still be
// allowed through with one extra confirm tap.
export async function findPossibleDuplicateExpense(
  userId: number,
  date: string,
  amount: number,
  merchant: string,
): Promise<PossibleDuplicateExpense | null> {
  await ensureSchema();
  const { rows } = await sql<PossibleDuplicateExpense>`
    SELECT id, to_char(date, 'YYYY-MM-DD') AS date, amount::text AS amount, merchant
    FROM expenses
    WHERE user_id = ${userId}
      AND date = ${date}
      AND amount = ${amount}
      AND lower(merchant) = lower(${merchant})
    ORDER BY id DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function createExpense(userId: number, input: ExpenseInput): Promise<Expense> {
  await ensureSchema();
  const direction = input.type === "transfer" ? input.direction : null;
  const walletId = await resolveWalletId(userId, input.walletId);
  const { rows } = await sql<Expense>`
    WITH inserted AS (
      INSERT INTO expenses (user_id, type, direction, date, amount, merchant, category, notes, tags, wallet_id)
      VALUES (${userId}, ${input.type}, ${direction}, ${input.date}, ${input.amount}, ${input.merchant}, ${input.category}, ${input.notes ?? null}, ${toPgTextArray(input.tags ?? [])}::text[], ${walletId})
      RETURNING *
    )
    SELECT
      inserted.id,
      inserted.type,
      inserted.direction,
      to_char(inserted.date, 'YYYY-MM-DD') AS date,
      inserted.amount::text AS amount,
      inserted.merchant,
      inserted.category,
      inserted.notes,
      inserted.tags,
      (inserted.receipt_image IS NOT NULL) AS has_receipt,
      inserted.wallet_id,
      w.name AS wallet_name,
      inserted.split_group_id
    FROM inserted
    LEFT JOIN wallets w ON w.id = inserted.wallet_id;
  `;
  return rows[0];
}

export async function updateExpense(userId: number, id: number, input: ExpenseInput): Promise<Expense | null> {
  await ensureSchema();
  const direction = input.type === "transfer" ? input.direction : null;
  const walletId = await resolveWalletId(userId, input.walletId);
  const { rows } = await sql<Expense>`
    WITH updated AS (
      UPDATE expenses
      SET type = ${input.type},
          direction = ${direction},
          date = ${input.date},
          amount = ${input.amount},
          merchant = ${input.merchant},
          category = ${input.category},
          notes = ${input.notes ?? null},
          tags = ${toPgTextArray(input.tags ?? [])}::text[],
          wallet_id = ${walletId}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    )
    SELECT
      updated.id,
      updated.type,
      updated.direction,
      to_char(updated.date, 'YYYY-MM-DD') AS date,
      updated.amount::text AS amount,
      updated.merchant,
      updated.category,
      updated.notes,
      updated.tags,
      (updated.receipt_image IS NOT NULL OR EXISTS (SELECT 1 FROM expense_receipts er WHERE er.expense_id = updated.id)) AS has_receipt,
      updated.wallet_id,
      w.name AS wallet_name,
      updated.split_group_id
    FROM updated
    LEFT JOIN wallets w ON w.id = updated.wallet_id;
  `;
  return rows[0] ?? null;
}

export async function deleteExpense(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  // Wallet-to-wallet transfers are two linked rows (see createWalletTransfer)
  // — deleting one without the other would leave one wallet's balance moved
  // but not the other's, so both legs go together.
  const { rowCount } = await sql`
    DELETE FROM expenses
    WHERE user_id = ${userId}
      AND (
        id = ${id}
        OR transfer_group_id = (SELECT transfer_group_id FROM expenses WHERE id = ${id} AND user_id = ${userId})
      );
  `;
  return (rowCount ?? 0) > 0;
}

// Moves money between two of the user's own wallets: one 'out' leg on the
// source wallet and one 'in' leg on the destination, same amount and date,
// linked by transfer_group_id. Neither counts toward Income/Expenses
// totals (same as any other transfer), but each moves its wallet's balance.
export async function createWalletTransfer(
  userId: number,
  input: { fromWalletId: number; toWalletId: number; amount: number; date: string; notes?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  if (input.fromWalletId === input.toWalletId) {
    return { ok: false, error: "Choose two different wallets." };
  }

  const { rows: walletRows } = await sql<{ id: number; name: string }>`
    SELECT id, name FROM wallets WHERE user_id = ${userId} AND id IN (${input.fromWalletId}, ${input.toWalletId});
  `;
  const fromWallet = walletRows.find((w) => w.id === input.fromWalletId);
  const toWallet = walletRows.find((w) => w.id === input.toWalletId);
  if (!fromWallet || !toWallet) {
    return { ok: false, error: "Wallet not found." };
  }

  const groupId = `wt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.sql`
      INSERT INTO expenses (user_id, type, direction, date, amount, merchant, category, notes, wallet_id, transfer_group_id)
      VALUES (${userId}, 'transfer', 'out', ${input.date}, ${input.amount}, ${`Transfer to ${toWallet.name}`}, 'Self-transfer', ${input.notes ?? null}, ${fromWallet.id}, ${groupId});
    `;
    await client.sql`
      INSERT INTO expenses (user_id, type, direction, date, amount, merchant, category, notes, wallet_id, transfer_group_id)
      VALUES (${userId}, 'transfer', 'in', ${input.date}, ${input.amount}, ${`Transfer from ${fromWallet.name}`}, 'Self-transfer', ${input.notes ?? null}, ${toWallet.id}, ${groupId});
    `;
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { ok: true };
}

// BYTEA also isn't a Primitive the sql tag accepts directly, so the bytes
// are hex-encoded and cast with decode(...) the same way tags use ::text[].
export async function attachReceiptImage(
  userId: number,
  id: number,
  bytes: Buffer,
  mimeType: string,
): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE expenses
    SET receipt_image = decode(${bytes.toString("hex")}, 'hex'), receipt_image_type = ${mimeType}
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function getReceiptImage(userId: number, id: number): Promise<{ bytes: Buffer; mimeType: string } | null> {
  await ensureSchema();
  const { rows } = await sql<{ hex: string | null; mime: string | null }>`
    SELECT encode(receipt_image, 'hex') AS hex, receipt_image_type AS mime
    FROM expenses
    WHERE id = ${id} AND user_id = ${userId};
  `;
  const row = rows[0];
  if (!row?.hex || !row.mime) return null;
  return { bytes: Buffer.from(row.hex, "hex"), mimeType: row.mime };
}

// Multi-photo receipts (expense_receipts, schema v24) — additive to the
// single receipt_image/receipt_image_type columns above, which stay
// exactly as they were for backward compatibility. New uploads go here;
// old ones stay reachable at their original GET /receipt URL.
export type ExpenseReceiptSummary = { id: number; sortOrder: number };

export async function addExpenseReceipt(
  userId: number,
  expenseId: number,
  bytes: Buffer,
  mimeType: string,
): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ id: number }>`
    WITH owned AS (
      SELECT id FROM expenses WHERE id = ${expenseId} AND user_id = ${userId}
    ), next_order AS (
      SELECT COALESCE(MAX(sort_order) + 1, 0) AS n FROM expense_receipts WHERE expense_id = ${expenseId}
    )
    INSERT INTO expense_receipts (expense_id, image, image_type, sort_order)
    SELECT owned.id, decode(${bytes.toString("hex")}, 'hex'), ${mimeType}, next_order.n
    FROM owned, next_order
    RETURNING id;
  `;
  return rows[0]?.id ?? null;
}

export async function listExpenseReceipts(userId: number, expenseId: number): Promise<ExpenseReceiptSummary[]> {
  await ensureSchema();
  const { rows } = await sql<{ id: number; sort_order: number }>`
    SELECT er.id, er.sort_order
    FROM expense_receipts er
    JOIN expenses e ON e.id = er.expense_id
    WHERE er.expense_id = ${expenseId} AND e.user_id = ${userId}
    ORDER BY er.sort_order ASC, er.id ASC;
  `;
  return rows.map((r) => ({ id: r.id, sortOrder: r.sort_order }));
}

export async function getExpenseReceiptImage(userId: number, receiptId: number): Promise<{ bytes: Buffer; mimeType: string } | null> {
  await ensureSchema();
  const { rows } = await sql<{ hex: string; mime: string }>`
    SELECT encode(er.image, 'hex') AS hex, er.image_type AS mime
    FROM expense_receipts er
    JOIN expenses e ON e.id = er.expense_id
    WHERE er.id = ${receiptId} AND e.user_id = ${userId};
  `;
  const row = rows[0];
  if (!row) return null;
  return { bytes: Buffer.from(row.hex, "hex"), mimeType: row.mime };
}

export async function deleteExpenseReceipt(userId: number, receiptId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    DELETE FROM expense_receipts er
    USING expenses e
    WHERE er.id = ${receiptId} AND er.expense_id = e.id AND e.user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export type UserRow = {
  id: number;
  username: string;
  password_hash: string | null;
  email: string | null;
  github_id: string | null;
};

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email, github_id FROM users WHERE username = ${username};
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email, github_id FROM users WHERE id = ${id};
  `;
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email, github_id FROM users WHERE lower(email) = lower(${email});
  `;
  return rows[0] ?? null;
}

export async function getUserByGithubId(githubId: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email, github_id FROM users WHERE github_id = ${githubId};
  `;
  return rows[0] ?? null;
}

// Links an existing (already-authenticated) account to a GitHub identity —
// see /api/auth/github/link. Distinct from createUserFromGithub, which is
// for a brand-new sign-in with no existing Tally account. The unique index
// on github_id (see ensureSchema) is the actual guard against two accounts
// claiming the same GitHub identity; the route checks it explicitly first
// too, so it can show a clear error instead of a raw constraint violation.
export async function linkGithubId(userId: number, githubId: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET github_id = ${githubId} WHERE id = ${userId};`;
}

export async function unlinkGithubId(userId: number): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET github_id = NULL WHERE id = ${userId};`;
}

export async function updateUsername(userId: number, newUsername: string): Promise<string> {
  await ensureSchema();
  const { rows } = await sql<{ username: string }>`
    UPDATE users SET username = ${newUsername} WHERE id = ${userId} RETURNING username;
  `;
  return rows[0].username;
}

export async function updateUserEmail(userId: number, email: string | null): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql<{ email: string | null }>`
    UPDATE users SET email = ${email} WHERE id = ${userId} RETURNING email;
  `;
  return rows[0]?.email ?? null;
}

export async function updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId};`;
}

export async function getSessionVersionForUser(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ session_version: number }>`SELECT session_version FROM users WHERE id = ${userId};`;
  return rows[0]?.session_version ?? 0;
}

// Invalidates every session token issued before this call — see
// lib/session.ts and lib/session-version.ts.
export async function bumpSessionVersion(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ session_version: number }>`
    UPDATE users SET session_version = session_version + 1 WHERE id = ${userId}
    RETURNING session_version;
  `;
  return rows[0]?.session_version ?? 0;
}

// ---- Password reset tokens ----

// Shared by password reset tokens and API tokens (below) — only the hash
// is ever stored, so a database leak alone can't be used to authenticate.
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// Invalidates any still-usable tokens for this user first, so only the most
// recently requested reset link works — otherwise an old, forwarded, or
// leaked email would stay valid indefinitely alongside newer ones.
// Counts tokens requested for this user within the trailing window,
// including already-used/expired ones — used to rate-limit forgot-password
// requests. DB-backed (rather than in-memory) so the limit holds even
// across multiple serverless instances.
export async function countRecentPasswordResetTokens(userId: number, minutes: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM password_reset_tokens
    WHERE user_id = ${userId} AND created_at > now() - make_interval(mins => ${minutes});
  `;
  return rows[0]?.n ?? 0;
}

// ---- Login rate limiting ----

// Case-insensitive so "Alice"/"alice"/"ALICE" share one bucket.
function normalizeLoginUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function countRecentLoginAttempts(username: string, minutes: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM login_attempts
    WHERE username = ${normalizeLoginUsername(username)} AND created_at > now() - make_interval(mins => ${minutes});
  `;
  return rows[0]?.n ?? 0;
}

export async function recordFailedLoginAttempt(username: string): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO login_attempts (username) VALUES (${normalizeLoginUsername(username)});`;
}

export async function createPasswordResetToken(userId: number): Promise<string> {
  await ensureSchema();
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL;`;
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(rawToken)}, ${expiresAt.toISOString()});
  `;
  return rawToken;
}

// Marks the token used and returns the owning user id, or null if the token
// is unknown, expired, or already used — atomic single UPDATE so a token
// can't be raced into being consumed twice.
export async function consumePasswordResetToken(rawToken: string): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ user_id: number }>`
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE token_hash = ${hashToken(rawToken)} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id;
  `;
  return rows[0]?.user_id ?? null;
}

// ---- Personal access tokens (unattended receipt import) ----

export type ApiTokenRow = {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

export async function listApiTokens(userId: number): Promise<ApiTokenRow[]> {
  await ensureSchema();
  const { rows } = await sql<ApiTokenRow>`
    SELECT id, name, created_at::text AS created_at, last_used_at::text AS last_used_at
    FROM api_tokens WHERE user_id = ${userId} ORDER BY created_at DESC;
  `;
  return rows;
}

// Returns the raw token — shown to the user once, at creation, same as any
// other personal-access-token UX. Only the hash is ever stored.
export async function createApiToken(userId: number, name: string): Promise<{ id: number; token: string }> {
  await ensureSchema();
  const token = randomBytes(24).toString("hex");
  const { rows } = await sql<{ id: number }>`
    INSERT INTO api_tokens (user_id, token_hash, name)
    VALUES (${userId}, ${hashToken(token)}, ${name})
    RETURNING id;
  `;
  return { id: rows[0].id, token };
}

export async function revokeApiToken(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM api_tokens WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

// Unlike password reset tokens this doesn't consume/expire the token —
// it's meant to sit in a Shortcuts automation and authenticate repeatedly.
export async function verifyApiToken(rawToken: string): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ user_id: number }>`
    UPDATE api_tokens SET last_used_at = now()
    WHERE token_hash = ${hashToken(rawToken)}
    RETURNING user_id;
  `;
  return rows[0]?.user_id ?? null;
}

// Sanity/cost guard for unattended imports (each one calls the paid Gemini
// API) — counts expenses tagged "auto-import" created in the trailing
// window, regardless of which intake path created them.
export async function countRecentAutoImports(userId: number, hours: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM expenses
    WHERE user_id = ${userId} AND 'auto-import' = ANY(tags) AND created_at > now() - make_interval(hours => ${hours});
  `;
  return rows[0]?.n ?? 0;
}

// ---- Gemini usage (interactive receipt/voice scans) ----

export async function countRecentGeminiUsage(userId: number, hours: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM gemini_usage
    WHERE user_id = ${userId} AND created_at > now() - make_interval(hours => ${hours});
  `;
  return rows[0]?.n ?? 0;
}

export async function recordGeminiUsage(userId: number): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO gemini_usage (user_id) VALUES (${userId});`;
}

// ---- Security event log ----

export type SecurityEvent = { event: string; created_at: string };

export async function logSecurityEvent(userId: number, event: string): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO security_events (user_id, event) VALUES (${userId}, ${event});`;
}

export async function listSecurityEvents(userId: number, limit = 20): Promise<SecurityEvent[]> {
  await ensureSchema();
  const { rows } = await sql<SecurityEvent>`
    SELECT event, created_at::text AS created_at FROM security_events
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit};
  `;
  return rows;
}

// expenses/categories/app_settings all reference users(id) ON DELETE CASCADE
// (see ensureSchema), so deleting the user row removes everything else too.
export async function deleteUser(userId: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM users WHERE id = ${userId};`;
}

export async function createUser(username: string, passwordHash: string): Promise<{ id: number; username: string }> {
  await ensureSchema();
  const { rows } = await sql<{ id: number; username: string }>`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username;
  `;
  const user = rows[0];
  // Explicit negative `id` avoids colliding with the legacy singleton row
  // (id=1, still PRIMARY KEY until the schema is hardened post-migration —
  // see hardenMultiUserConstraints) or with any other new user's own row.
  await sql`INSERT INTO app_settings (id, user_id, starting_balance) VALUES (${-user.id}, ${user.id}, 0);`;
  return user;
}

// Used by GitHub sign-in (see /api/auth/github/callback) for a brand-new
// account — no password, since there's nothing to hash. `desiredUsername`
// is the GitHub login, already sanitized/deduped by the caller against
// getUserByUsername before this is called, so this just inserts it as-is.
export async function createUserFromGithub(
  username: string,
  githubId: string,
): Promise<{ id: number; username: string }> {
  await ensureSchema();
  const { rows } = await sql<{ id: number; username: string }>`
    INSERT INTO users (username, password_hash, github_id)
    VALUES (${username}, NULL, ${githubId})
    RETURNING id, username;
  `;
  const user = rows[0];
  await sql`INSERT INTO app_settings (id, user_id, starting_balance) VALUES (${-user.id}, ${user.id}, 0);`;
  return user;
}

// ---- Recurring transactions ----

export type RecurringRuleRow = {
  id: number;
  type: string;
  direction: string | null;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  wallet_id: number | null;
  frequency: string;
  next_run_date: string;
  active: boolean;
};

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Advances a YYYY-MM-DD date by one occurrence of the given frequency.
// Monthly clamps the day to the target month's length (e.g. Jan 31 -> Feb
// 28); yearly relies on the Date constructor's own Feb 29 -> Mar 1 rollover
// in non-leap years, which matches how most billing dates actually behave.
function advanceDate(dateStr: string, frequency: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (frequency === "weekly") return toDateStr(new Date(y, m - 1, d + 7));
  if (frequency === "yearly") return toDateStr(new Date(y + 1, m - 1, d));
  const daysInNextMonth = new Date(y, m + 1, 0).getDate();
  return toDateStr(new Date(y, m, Math.min(d, daysInNextMonth)));
}

export async function listRecurringRules(userId: number): Promise<RecurringRuleRow[]> {
  await ensureSchema();
  const { rows } = await sql<RecurringRuleRow>`
    SELECT id, type, direction, amount::text AS amount, merchant, category, notes,
           wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active
    FROM recurring_rules
    WHERE user_id = ${userId}
    ORDER BY sort_order, id;
  `;
  return rows;
}

export async function createRecurringRule(
  userId: number,
  input: {
    type: string;
    direction?: string | null;
    amount: number;
    merchant: string;
    category: string;
    notes?: string | null;
    walletId?: number | null;
    frequency: string;
    startDate: string;
  },
): Promise<RecurringRuleRow> {
  await ensureSchema();
  const walletId = await resolveWalletId(userId, input.walletId);
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM recurring_rules WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<RecurringRuleRow>`
    INSERT INTO recurring_rules (user_id, type, direction, amount, merchant, category, notes, wallet_id, frequency, next_run_date, sort_order)
    VALUES (${userId}, ${input.type}, ${input.direction ?? null}, ${input.amount}, ${input.merchant}, ${input.category}, ${input.notes ?? null}, ${walletId}, ${input.frequency}, ${input.startDate}, ${nextSort})
    RETURNING id, type, direction, amount::text AS amount, merchant, category, notes, wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active;
  `;
  return rows[0];
}

// Swaps this rule's sort_order with its neighbor in the current ordering —
// simple adjacent-swap reordering rather than drag-and-drop, since the list
// is short and this avoids the pointer-event complexity that's caused
// problems elsewhere in the dashboard widget editor.
export async function moveRecurringRule(userId: number, id: number, direction: "up" | "down"): Promise<void> {
  await ensureSchema();
  const { rows } = await sql<{ id: number; sort_order: number }>`
    SELECT id, sort_order FROM recurring_rules WHERE user_id = ${userId} ORDER BY sort_order, id;
  `;
  const idx = rows.findIndex((r) => r.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.sql`UPDATE recurring_rules SET sort_order = ${b.sort_order} WHERE id = ${a.id} AND user_id = ${userId};`;
    await client.sql`UPDATE recurring_rules SET sort_order = ${a.sort_order} WHERE id = ${b.id} AND user_id = ${userId};`;
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRecurringRule(
  userId: number,
  id: number,
  input: {
    active?: boolean;
    amount?: number;
    merchant?: string;
    category?: string;
    notes?: string | null;
    walletId?: number | null;
    frequency?: string;
  },
): Promise<RecurringRuleRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<RecurringRuleRow>`
    SELECT id, type, direction, amount::text AS amount, merchant, category, notes, wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active
    FROM recurring_rules WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const newWalletId =
    input.walletId !== undefined ? await resolveWalletId(userId, input.walletId) : existing.wallet_id;

  const { rows } = await sql<RecurringRuleRow>`
    UPDATE recurring_rules
    SET active = ${input.active ?? existing.active},
        amount = ${input.amount ?? Number(existing.amount)},
        merchant = ${input.merchant ?? existing.merchant},
        category = ${input.category ?? existing.category},
        notes = ${input.notes !== undefined ? input.notes : existing.notes},
        wallet_id = ${newWalletId},
        frequency = ${input.frequency ?? existing.frequency}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, type, direction, amount::text AS amount, merchant, category, notes, wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active;
  `;
  return rows[0] ?? null;
}

export async function deleteRecurringRule(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM recurring_rules WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

// Advances next_run_date by one occurrence without logging an expense —
// for "not this time" without pausing or deleting the whole rule.
export async function skipRecurringRule(userId: number, id: number): Promise<RecurringRuleRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<{ next_run_date: string; frequency: string }>`
    SELECT to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, frequency
    FROM recurring_rules WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;
  const nextRunDate = advanceDate(existing.next_run_date, existing.frequency);
  const { rows } = await sql<RecurringRuleRow>`
    UPDATE recurring_rules SET next_run_date = ${nextRunDate}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, type, direction, amount::text AS amount, merchant, category, notes, wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active;
  `;
  return rows[0] ?? null;
}

// Materializes any recurring rule whose next occurrence has arrived into a
// real expense row, then advances next_run_date — called on every dashboard
// load rather than via a separate cron job/worker, which this deployment
// doesn't have. Caps catch-up at 36 occurrences per rule so a long-dormant
// rule (e.g. re-activated after months) can't flood the ledger.
export type AutoLoggedTransaction = { merchant: string; amount: number; date: string; type: string };

// Returns what it logged so callers can decide whether to notify the user —
// see notifyRecurringEmail in page.tsx, which is the only current consumer.
export async function processDueRecurringRules(userId: number): Promise<AutoLoggedTransaction[]> {
  await ensureSchema();
  const { rows } = await sql<RecurringRuleRow>`
    SELECT id, type, direction, amount::text AS amount, merchant, category, notes, wallet_id, frequency, to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active
    FROM recurring_rules
    WHERE user_id = ${userId} AND active = true AND next_run_date <= CURRENT_DATE;
  `;
  const today = toDateStr(new Date());
  const logged: AutoLoggedTransaction[] = [];
  for (const rule of rows) {
    let nextRunDate = rule.next_run_date;
    let iterations = 0;
    while (nextRunDate <= today && iterations < 36) {
      const base = {
        date: nextRunDate,
        amount: Number(rule.amount),
        merchant: rule.merchant,
        category: rule.category,
        notes: rule.notes,
        walletId: rule.wallet_id,
        tags: [],
      };
      const ruleInput: ExpenseInput =
        rule.type === "transfer"
          ? { type: "transfer", direction: rule.direction === "in" ? "in" : "out", ...base }
          : { type: rule.type === "income" ? "income" : "expense", ...base };
      await createExpense(userId, ruleInput);
      logged.push({ merchant: rule.merchant, amount: Number(rule.amount), date: nextRunDate, type: rule.type });
      nextRunDate = advanceDate(nextRunDate, rule.frequency);
      iterations += 1;
      // Advance next_run_date after each occurrence (not just once at the end
      // of the catch-up loop) so a failure partway through a long catch-up
      // run can't cause the next call to re-log transactions already created.
      await sql`UPDATE recurring_rules SET next_run_date = ${nextRunDate} WHERE id = ${rule.id};`;
    }
  }
  return logged;
}

// ---- Budgets ----

export type BudgetRow = {
  id: number;
  category: string;
  monthly_limit: string;
  dismissed_alert_month: string | null;
  rollover: boolean;
  notified_alert_month: string | null;
};

export async function listBudgets(userId: number): Promise<BudgetRow[]> {
  await ensureSchema();
  const { rows } = await sql<BudgetRow>`
    SELECT id, category, monthly_limit::text AS monthly_limit, dismissed_alert_month, rollover, notified_alert_month
    FROM budgets WHERE user_id = ${userId} ORDER BY category;
  `;
  return rows;
}

export async function upsertBudget(
  userId: number,
  category: string,
  monthlyLimit: number,
  rollover: boolean,
): Promise<BudgetRow> {
  await ensureSchema();
  const { rows } = await sql<BudgetRow>`
    INSERT INTO budgets (user_id, category, monthly_limit, rollover)
    VALUES (${userId}, ${category}, ${monthlyLimit}, ${rollover})
    ON CONFLICT (user_id, category) DO UPDATE SET monthly_limit = ${monthlyLimit}, rollover = ${rollover}
    RETURNING id, category, monthly_limit::text AS monthly_limit, dismissed_alert_month, rollover, notified_alert_month;
  `;
  return rows[0];
}

export async function deleteBudget(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM budgets WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

export async function dismissBudgetAlert(userId: number, id: number, month: string): Promise<BudgetRow | null> {
  await ensureSchema();
  const { rows } = await sql<BudgetRow>`
    UPDATE budgets SET dismissed_alert_month = ${month}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, category, monthly_limit::text AS monthly_limit, dismissed_alert_month, rollover, notified_alert_month;
  `;
  return rows[0] ?? null;
}

export async function markBudgetNotified(userId: number, id: number, month: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE budgets SET notified_alert_month = ${month} WHERE id = ${id} AND user_id = ${userId};`;
}

// ---- Savings goals ----

export type SavingsGoalRow = {
  id: number;
  name: string;
  color: string;
  target_amount: string;
  current_amount: string;
};

export async function listSavingsGoals(userId: number): Promise<SavingsGoalRow[]> {
  await ensureSchema();
  const { rows } = await sql<SavingsGoalRow>`
    SELECT id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount
    FROM savings_goals WHERE user_id = ${userId} ORDER BY sort_order, id;
  `;
  return rows;
}

export async function createSavingsGoal(
  userId: number,
  input: { name: string; color: string; targetAmount: number },
): Promise<SavingsGoalRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM savings_goals WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<SavingsGoalRow>`
    INSERT INTO savings_goals (user_id, name, color, target_amount, sort_order)
    VALUES (${userId}, ${input.name}, ${input.color}, ${input.targetAmount}, ${nextSort})
    RETURNING id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount;
  `;
  return rows[0];
}

// Same adjacent-swap approach as moveRecurringRule.
export async function moveSavingsGoal(userId: number, id: number, direction: "up" | "down"): Promise<void> {
  await ensureSchema();
  const { rows } = await sql<{ id: number; sort_order: number }>`
    SELECT id, sort_order FROM savings_goals WHERE user_id = ${userId} ORDER BY sort_order, id;
  `;
  const idx = rows.findIndex((r) => r.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.sql`UPDATE savings_goals SET sort_order = ${b.sort_order} WHERE id = ${a.id} AND user_id = ${userId};`;
    await client.sql`UPDATE savings_goals SET sort_order = ${a.sort_order} WHERE id = ${b.id} AND user_id = ${userId};`;
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateSavingsGoal(
  userId: number,
  id: number,
  input: { name?: string; color?: string; targetAmount?: number; contributeDelta?: number },
): Promise<SavingsGoalRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<SavingsGoalRow>`
    SELECT id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount
    FROM savings_goals WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const newName = input.name?.trim() ?? existing.name;
  const newColor = input.color ?? existing.color;
  const newTarget = input.targetAmount ?? Number(existing.target_amount);
  const newCurrent = Math.max(0, Number(existing.current_amount) + (input.contributeDelta ?? 0));
  // The delta actually applied, after the floor-at-0 clamp above — logging
  // this (not the raw requested contributeDelta) keeps the history in sync
  // with what current_amount actually changed by.
  const appliedDelta = newCurrent - Number(existing.current_amount);

  const { rows } = await sql<SavingsGoalRow>`
    UPDATE savings_goals
    SET name = ${newName}, color = ${newColor}, target_amount = ${newTarget}, current_amount = ${newCurrent}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount;
  `;
  if (input.contributeDelta !== undefined && appliedDelta !== 0) {
    await sql`INSERT INTO savings_goal_contributions (goal_id, user_id, delta) VALUES (${id}, ${userId}, ${appliedDelta});`;
  }
  return rows[0] ?? null;
}

export type SavingsGoalContribution = { id: number; delta: string; created_at: string };

export async function listSavingsGoalContributions(userId: number, goalId: number): Promise<SavingsGoalContribution[]> {
  await ensureSchema();
  const { rows } = await sql<SavingsGoalContribution>`
    SELECT id, delta::text AS delta, created_at::text AS created_at FROM savings_goal_contributions
    WHERE goal_id = ${goalId} AND user_id = ${userId} ORDER BY created_at DESC LIMIT 50;
  `;
  return rows;
}

// Deletes a mis-entered contribution and reverses its effect on the goal's
// current_amount (clamped at 0, same floor as updateSavingsGoal) — both in
// one transaction so the log and the total can't drift apart if one half
// fails.
export async function deleteSavingsGoalContribution(userId: number, contributionId: number): Promise<SavingsGoalRow | null> {
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: contribRows } = await client.sql<{ goal_id: number; delta: string }>`
      SELECT goal_id, delta::text AS delta FROM savings_goal_contributions
      WHERE id = ${contributionId} AND user_id = ${userId};
    `;
    const contribution = contribRows[0];
    if (!contribution) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.sql`DELETE FROM savings_goal_contributions WHERE id = ${contributionId} AND user_id = ${userId};`;
    const { rows } = await client.sql<SavingsGoalRow>`
      UPDATE savings_goals
      SET current_amount = GREATEST(0, current_amount - ${Number(contribution.delta)})
      WHERE id = ${contribution.goal_id} AND user_id = ${userId}
      RETURNING id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount;
    `;
    await client.query("COMMIT");
    return rows[0] ?? null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteSavingsGoal(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM savings_goals WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

// ---- Split transactions ----

// Creates one expense row per line, all sharing a split_group_id purely for
// display grouping (see the split_group_id column comment in ensureSchema)
// — each line is otherwise an ordinary, independently editable expense.
export async function createSplitExpense(
  userId: number,
  input: {
    type: string;
    date: string;
    merchant: string;
    notes?: string | null;
    tags?: string[];
    walletId?: number | null;
    lines: { category: string; amount: number }[];
  },
): Promise<Expense[]> {
  await ensureSchema();
  const walletId = await resolveWalletId(userId, input.walletId);
  const groupId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const results: Expense[] = [];
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const line of input.lines) {
      const { rows } = await client.sql<Expense>`
        WITH inserted AS (
          INSERT INTO expenses (user_id, type, date, amount, merchant, category, notes, tags, wallet_id, split_group_id)
          VALUES (${userId}, ${input.type}, ${input.date}, ${line.amount}, ${input.merchant}, ${line.category}, ${input.notes ?? null}, ${toPgTextArray(input.tags ?? [])}::text[], ${walletId}, ${groupId})
          RETURNING *
        )
        SELECT
          inserted.id, inserted.type, inserted.direction,
          to_char(inserted.date, 'YYYY-MM-DD') AS date,
          inserted.amount::text AS amount, inserted.merchant, inserted.category, inserted.notes, inserted.tags,
          (inserted.receipt_image IS NOT NULL) AS has_receipt, inserted.wallet_id, w.name AS wallet_name, inserted.split_group_id
        FROM inserted
        LEFT JOIN wallets w ON w.id = inserted.wallet_id;
      `;
      results.push(rows[0]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return results;
}

export async function seedDefaultCategoriesForUser(userId: number): Promise<void> {
  await ensureSchema();
  for (const d of DEFAULT_CATEGORIES) {
    await sql`
      INSERT INTO categories (user_id, type, name, color, sort_order)
      VALUES (${userId}, ${d.type}, ${d.name}, ${d.color}, ${d.sort})
      ON CONFLICT (user_id, type, name) DO NOTHING;
    `;
  }
}

export async function getProfilePicture(userId: number): Promise<Buffer | null> {
  await ensureSchema();
  const { rows } = await sql<{ profile_picture: string | null }>`
    SELECT encode(profile_picture, 'base64') as profile_picture FROM users WHERE id = ${userId} AND profile_picture IS NOT NULL;
  `;
  if (!rows[0]?.profile_picture) return null;
  return Buffer.from(rows[0].profile_picture, "base64");
}

export async function updateProfilePicture(userId: number, imageBuffer: Buffer | null): Promise<void> {
  await ensureSchema();
  if (imageBuffer) {
    const encoded = imageBuffer.toString("base64");
    await sql`UPDATE users SET profile_picture = decode(${encoded}, 'base64') WHERE id = ${userId};`;
  } else {
    await sql`UPDATE users SET profile_picture = NULL WHERE id = ${userId};`;
  }
}

// ---- Friends & family ----

export type UserSearchResult = { id: number; username: string };

export async function searchUsers(userId: number, query: string): Promise<UserSearchResult[]> {
  await ensureSchema();
  const q = query.trim();
  if (!q) return [];
  const { rows } = await sql<UserSearchResult>`
    SELECT id, username FROM users
    WHERE id <> ${userId} AND (username ILIKE ${"%" + q + "%"} OR lower(email) = lower(${q}))
    ORDER BY username
    LIMIT 10;
  `;
  return rows;
}

export type FriendRow = { id: number; username: string; is_family: boolean };
export type FriendRequestRow = { id: number; username: string; created_at: string };

export async function listFriends(userId: number): Promise<FriendRow[]> {
  await ensureSchema();
  const { rows } = await sql<FriendRow>`
    SELECT u.id, u.username,
      EXISTS(SELECT 1 FROM family_members fm WHERE fm.user_id = ${userId} AND fm.member_id = u.id) AS is_family
    FROM friend_requests fr
    JOIN users u ON u.id = (CASE WHEN fr.requester_id = ${userId} THEN fr.addressee_id ELSE fr.requester_id END)
    WHERE fr.status = 'accepted' AND (fr.requester_id = ${userId} OR fr.addressee_id = ${userId})
    ORDER BY u.username;
  `;
  return rows;
}

export async function listFamilyMembers(userId: number): Promise<FriendRow[]> {
  await ensureSchema();
  const { rows } = await sql<FriendRow>`
    SELECT u.id, u.username, true AS is_family
    FROM family_members fm
    JOIN users u ON u.id = fm.member_id
    WHERE fm.user_id = ${userId}
    ORDER BY u.username;
  `;
  return rows;
}

export async function listIncomingFriendRequests(userId: number): Promise<FriendRequestRow[]> {
  await ensureSchema();
  const { rows } = await sql<FriendRequestRow>`
    SELECT fr.id, u.username, fr.created_at
    FROM friend_requests fr
    JOIN users u ON u.id = fr.requester_id
    WHERE fr.addressee_id = ${userId} AND fr.status = 'pending'
    ORDER BY fr.created_at DESC;
  `;
  return rows;
}

export async function listOutgoingFriendRequests(userId: number): Promise<FriendRequestRow[]> {
  await ensureSchema();
  const { rows } = await sql<FriendRequestRow>`
    SELECT fr.id, u.username, fr.created_at
    FROM friend_requests fr
    JOIN users u ON u.id = fr.addressee_id
    WHERE fr.requester_id = ${userId} AND fr.status = 'pending'
    ORDER BY fr.created_at DESC;
  `;
  return rows;
}

// Auto-accepts instead of creating a second pending row if the target
// already sent *us* a request — mirrors how most social apps resolve two
// people requesting each other around the same time.
export async function sendFriendRequest(
  userId: number,
  targetUserId: number,
): Promise<{ status: "requested" | "accepted" } | { error: string }> {
  await ensureSchema();
  if (userId === targetUserId) return { error: "You can't add yourself." };
  const target = await getUserById(targetUserId);
  if (!target) return { error: "User not found." };

  const { rows: existing } = await sql<{ id: number; requester_id: number; status: string }>`
    SELECT id, requester_id, status FROM friend_requests
    WHERE (requester_id = ${userId} AND addressee_id = ${targetUserId})
       OR (requester_id = ${targetUserId} AND addressee_id = ${userId});
  `;
  const row = existing[0];
  if (row) {
    if (row.status === "accepted") return { error: "You're already friends." };
    if (row.requester_id === targetUserId) {
      await sql`UPDATE friend_requests SET status = 'accepted', responded_at = now() WHERE id = ${row.id};`;
      return { status: "accepted" };
    }
    return { error: "Friend request already sent." };
  }

  await sql`INSERT INTO friend_requests (requester_id, addressee_id) VALUES (${userId}, ${targetUserId});`;
  return { status: "requested" };
}

export async function acceptFriendRequest(userId: number, requestId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE friend_requests SET status = 'accepted', responded_at = now()
    WHERE id = ${requestId} AND addressee_id = ${userId} AND status = 'pending';
  `;
  return (rowCount ?? 0) > 0;
}

// Also covers declining an incoming request and cancelling one you sent —
// both are just "delete the pending row," gated to whichever side of the
// pair the caller is on.
export async function deleteFriendRequest(userId: number, requestId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    DELETE FROM friend_requests
    WHERE id = ${requestId} AND status = 'pending' AND (requester_id = ${userId} OR addressee_id = ${userId});
  `;
  return (rowCount ?? 0) > 0;
}

export async function removeFriend(userId: number, friendId: number): Promise<void> {
  await ensureSchema();
  await sql`
    DELETE FROM friend_requests
    WHERE status = 'accepted'
      AND ((requester_id = ${userId} AND addressee_id = ${friendId})
        OR (requester_id = ${friendId} AND addressee_id = ${userId}));
  `;
  await sql`
    DELETE FROM family_members
    WHERE (user_id = ${userId} AND member_id = ${friendId})
       OR (user_id = ${friendId} AND member_id = ${userId});
  `;
}

export async function addFamilyMember(userId: number, memberId: number): Promise<{ ok: true } | { error: string }> {
  await ensureSchema();
  const { rows } = await sql<{ status: string }>`
    SELECT status FROM friend_requests
    WHERE status = 'accepted'
      AND ((requester_id = ${userId} AND addressee_id = ${memberId})
        OR (requester_id = ${memberId} AND addressee_id = ${userId}));
  `;
  if (!rows[0]) return { error: "You can only add friends to Family." };
  await sql`
    INSERT INTO family_members (user_id, member_id) VALUES (${userId}, ${memberId})
    ON CONFLICT (user_id, member_id) DO NOTHING;
  `;
  return { ok: true };
}

export async function removeFamilyMember(userId: number, memberId: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM family_members WHERE user_id = ${userId} AND member_id = ${memberId};`;
}

// ---- Challenges ----


async function areFriends(userId: number, otherId: number): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM friend_requests
    WHERE status = 'accepted'
      AND ((requester_id = ${userId} AND addressee_id = ${otherId})
        OR (requester_id = ${otherId} AND addressee_id = ${userId}));
  `;
  return rows.length > 0;
}

export type ChallengeRow = {
  id: number;
  creator_id: number;
  title: string;
  type: ChallengeType;
  mode: ChallengeMode;
  target_amount: string;
  category: string | null;
  start_date: string;
  end_date: string;
};

export type ChallengeParticipantRow = {
  id: number;
  user_id: number;
  username: string;
  status: "invited" | "accepted" | "declined";
  progress_amount: string;
  is_me: boolean;
  revealed_to_me: boolean;
};

export type ChallengeListItem = ChallengeRow & { participant_count: number; my_status: "invited" | "accepted" | "declined" };

export async function listChallenges(userId: number): Promise<ChallengeListItem[]> {
  await ensureSchema();
  const { rows } = await sql<ChallengeListItem & { participant_count: string }>`
    SELECT c.id, c.creator_id, c.title, c.type, c.mode, c.target_amount::text AS target_amount, c.category,
      to_char(c.start_date, 'YYYY-MM-DD') AS start_date, to_char(c.end_date, 'YYYY-MM-DD') AS end_date,
      cp.status AS my_status,
      (SELECT COUNT(*) FROM challenge_participants cp2 WHERE cp2.challenge_id = c.id) AS participant_count
    FROM challenges c
    JOIN challenge_participants cp ON cp.challenge_id = c.id AND cp.user_id = ${userId}
    ORDER BY c.created_at DESC;
  `;
  return rows.map((r) => ({ ...r, participant_count: Number(r.participant_count) }));
}

export async function createChallenge(
  creatorId: number,
  input: {
    title: string;
    type: ChallengeType;
    mode: ChallengeMode;
    targetAmount: number;
    category?: string | null;
    startDate: string;
    endDate: string;
    inviteeIds: number[];
  },
): Promise<{ id: number } | { error: string }> {
  await ensureSchema();
  const invitees = [...new Set(input.inviteeIds)].filter((id) => id !== creatorId);
  for (const id of invitees) {
    if (!(await areFriends(creatorId, id))) {
      return { error: "You can only invite friends to a challenge." };
    }
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.sql<{ id: number }>`
      INSERT INTO challenges (creator_id, title, type, mode, target_amount, category, start_date, end_date)
      VALUES (${creatorId}, ${input.title}, ${input.type}, ${input.mode}, ${input.targetAmount}, ${input.category ?? null}, ${input.startDate}, ${input.endDate})
      RETURNING id;
    `;
    const challengeId = rows[0].id;
    await client.sql`
      INSERT INTO challenge_participants (challenge_id, user_id, status) VALUES (${challengeId}, ${creatorId}, 'accepted');
    `;
    for (const inviteeId of invitees) {
      await client.sql`
        INSERT INTO challenge_participants (challenge_id, user_id, status) VALUES (${challengeId}, ${inviteeId}, 'invited');
      `;
    }
    await client.query("COMMIT");
    return { id: challengeId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Only ever recomputes the CALLER's own progress, from the CALLER's own
// expenses — never another participant's, keeping every account's
// transactions private even though the challenge itself is shared.
async function recomputeChallengeProgress(userId: number, challenge: ChallengeRow): Promise<void> {
  if (challenge.type === "savings") return; // tracked by manual contributions instead
  let amount = 0;
  if (challenge.type === "spending_limit") {
    const { rows } = await sql<{ total: string | null }>`
      SELECT SUM(amount)::text AS total FROM expenses
      WHERE user_id = ${userId} AND type = 'expense'
        AND date >= ${challenge.start_date} AND date <= ${challenge.end_date}
        AND (${challenge.category}::text IS NULL OR category = ${challenge.category});
    `;
    amount = Number(rows[0]?.total ?? 0);
  } else {
    const { rows } = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM (
        SELECT d::date AS day
        FROM generate_series(${challenge.start_date}::timestamp, LEAST(${challenge.end_date}::date, CURRENT_DATE)::timestamp, interval '1 day') d
        WHERE NOT EXISTS (
          SELECT 1 FROM expenses e
          WHERE e.user_id = ${userId} AND e.type = 'expense' AND e.date = d::date
        )
      ) no_spend_days;
    `;
    amount = Number(rows[0]?.count ?? 0);
  }
  await sql`
    UPDATE challenge_participants SET progress_amount = ${amount}, progress_updated_at = now()
    WHERE challenge_id = ${challenge.id} AND user_id = ${userId};
  `;
}

export async function getChallenge(
  userId: number,
  challengeId: number,
): Promise<{ challenge: ChallengeRow; participants: ChallengeParticipantRow[] } | null> {
  await ensureSchema();
  const { rows: challengeRows } = await sql<ChallengeRow>`
    SELECT id, creator_id, title, type, mode, target_amount::text AS target_amount, category,
      to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date
    FROM challenges WHERE id = ${challengeId};
  `;
  const challenge = challengeRows[0];
  if (!challenge) return null;

  const { rows: myRow } = await sql`
    SELECT 1 FROM challenge_participants WHERE challenge_id = ${challengeId} AND user_id = ${userId};
  `;
  if (!myRow[0]) return null;

  // Refresh only the caller's own cached progress before reading the list.
  await recomputeChallengeProgress(userId, challenge);

  const { rows: participants } = await sql<ChallengeParticipantRow>`
    SELECT cp.id, cp.user_id, u.username, cp.status, cp.progress_amount::text AS progress_amount,
      (cp.user_id = ${userId}) AS is_me,
      (cp.user_id = ${userId} OR EXISTS(
        SELECT 1 FROM challenge_reveal_requests rr
        WHERE rr.challenge_id = ${challengeId} AND rr.requester_id = ${userId} AND rr.target_id = cp.user_id AND rr.status = 'accepted'
      )) AS revealed_to_me
    FROM challenge_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.challenge_id = ${challengeId} AND cp.status = 'accepted'
    ORDER BY cp.progress_amount DESC;
  `;
  return { challenge, participants };
}

export async function respondToChallengeInvite(userId: number, challengeId: number, accept: boolean): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE challenge_participants SET status = ${accept ? "accepted" : "declined"}
    WHERE challenge_id = ${challengeId} AND user_id = ${userId} AND status = 'invited';
  `;
  return (rowCount ?? 0) > 0;
}

// Deletes the whole challenge if the caller created it (cascades every
// participant row), otherwise just removes the caller's own participation.
export async function leaveChallenge(userId: number, challengeId: number): Promise<void> {
  await ensureSchema();
  const { rows } = await sql<{ creator_id: number }>`SELECT creator_id FROM challenges WHERE id = ${challengeId};`;
  if (!rows[0]) return;
  if (rows[0].creator_id === userId) {
    await sql`DELETE FROM challenges WHERE id = ${challengeId};`;
  } else {
    await sql`DELETE FROM challenge_participants WHERE challenge_id = ${challengeId} AND user_id = ${userId};`;
  }
}

export async function addChallengeContribution(
  userId: number,
  challengeId: number,
  amount: number,
): Promise<{ ok: true } | { error: string }> {
  await ensureSchema();
  const { rows } = await sql<{ type: ChallengeType; status: string }>`
    SELECT c.type, cp.status FROM challenges c
    JOIN challenge_participants cp ON cp.challenge_id = c.id AND cp.user_id = ${userId}
    WHERE c.id = ${challengeId};
  `;
  const row = rows[0];
  if (!row || row.status !== "accepted") return { error: "Not a participant in this challenge." };
  if (row.type !== "savings") return { error: "Only savings challenges take contributions." };
  await sql`
    UPDATE challenge_participants SET progress_amount = progress_amount + ${amount}, progress_updated_at = now()
    WHERE challenge_id = ${challengeId} AND user_id = ${userId};
  `;
  return { ok: true };
}

export async function requestChallengeReveal(
  requesterId: number,
  challengeId: number,
  targetId: number,
): Promise<{ ok: true } | { error: string }> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT 1 FROM challenge_participants WHERE challenge_id = ${challengeId} AND user_id IN (${requesterId}, ${targetId});
  `;
  if (rows.length < 2) return { error: "Both people must be participants in this challenge." };
  // ON CONFLICT DO NOTHING would leave a previously-declined request stuck
  // as 'declined' forever, with no way to ask again -- reset it back to
  // pending instead (a no-op if it's already pending or accepted).
  await sql`
    INSERT INTO challenge_reveal_requests (challenge_id, requester_id, target_id)
    VALUES (${challengeId}, ${requesterId}, ${targetId})
    ON CONFLICT (challenge_id, requester_id, target_id)
    DO UPDATE SET status = 'pending', responded_at = NULL
    WHERE challenge_reveal_requests.status = 'declined';
  `;
  return { ok: true };
}

export type ChallengeRevealRequestRow = {
  id: number;
  challenge_id: number;
  challenge_title: string;
  requester_username: string;
};

export async function listIncomingChallengeReveals(userId: number): Promise<ChallengeRevealRequestRow[]> {
  await ensureSchema();
  const { rows } = await sql<ChallengeRevealRequestRow>`
    SELECT rr.id, rr.challenge_id, c.title AS challenge_title, u.username AS requester_username
    FROM challenge_reveal_requests rr
    JOIN challenges c ON c.id = rr.challenge_id
    JOIN users u ON u.id = rr.requester_id
    WHERE rr.target_id = ${userId} AND rr.status = 'pending'
    ORDER BY rr.created_at DESC;
  `;
  return rows;
}

export async function respondToChallengeReveal(userId: number, requestId: number, accept: boolean): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE challenge_reveal_requests SET status = ${accept ? "accepted" : "declined"}, responded_at = now()
    WHERE id = ${requestId} AND target_id = ${userId} AND status = 'pending';
  `;
  return (rowCount ?? 0) > 0;
}

// ---- Split bills ----

export async function getRequireSplitConfirmation(userId: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ require_split_confirmation: boolean }>`
    SELECT require_split_confirmation FROM app_settings WHERE user_id = ${userId};
  `;
  return rows[0]?.require_split_confirmation ?? false;
}

export async function setRequireSplitConfirmation(userId: number, enabled: boolean): Promise<boolean> {
  await ensureSchema();
  await sql`UPDATE app_settings SET require_split_confirmation = ${enabled} WHERE user_id = ${userId};`;
  return enabled;
}

export type SplitRow = {
  id: number;
  creator_id: number;
  title: string;
  total_amount: string;
  split_method: SplitMethod;
  date: string;
};

export type SplitParticipantRow = {
  id: number;
  user_id: number;
  username: string;
  owed_amount: string;
  paid_amount: string;
  confirm_status: "pending" | "accepted" | "declined";
  settled: boolean;
  is_me: boolean;
};

export type SplitListItem = SplitRow & {
  participant_count: number;
  my_net: string;
  my_confirm_status: "pending" | "accepted" | "declined";
  my_settled: boolean;
};

export async function listSplits(userId: number): Promise<SplitListItem[]> {
  await ensureSchema();
  const { rows } = await sql<SplitListItem & { participant_count: string }>`
    SELECT s.id, s.creator_id, s.title, s.total_amount::text AS total_amount, s.split_method,
      to_char(s.date, 'YYYY-MM-DD') AS date,
      sp.confirm_status AS my_confirm_status, sp.settled AS my_settled,
      (sp.paid_amount - sp.owed_amount)::text AS my_net,
      (SELECT COUNT(*) FROM split_participants sp2 WHERE sp2.split_id = s.id) AS participant_count
    FROM splits s
    JOIN split_participants sp ON sp.split_id = s.id AND sp.user_id = ${userId}
    ORDER BY s.created_at DESC;
  `;
  return rows.map((r) => ({ ...r, participant_count: Number(r.participant_count) }));
}

// Rounds to cents and assigns any leftover fraction (from a total that
// doesn't divide evenly) to the creator, so shares always sum to exactly
// totalAmount.
function splitEqually(totalAmount: number, participantIds: number[], creatorId: number): Map<number, number> {
  const n = participantIds.length;
  const base = Math.floor((totalAmount / n) * 100) / 100;
  const owed = new Map<number, number>();
  let assigned = 0;
  for (const id of participantIds) {
    owed.set(id, base);
    assigned += base;
  }
  const remainder = Math.round((totalAmount - assigned) * 100) / 100;
  owed.set(creatorId, Math.round(((owed.get(creatorId) ?? 0) + remainder) * 100) / 100);
  return owed;
}

function splitByCustomAmounts(
  totalAmount: number,
  participantIds: number[],
  entries: { userId: number; amount: number }[] | undefined,
): Map<number, number> | { error: string } {
  const provided = new Map((entries ?? []).map((e) => [e.userId, e.amount]));
  const amounts = new Map<number, number>();
  let sum = 0;
  for (const id of participantIds) {
    const amt = provided.get(id) ?? 0;
    amounts.set(id, amt);
    sum += amt;
  }
  if (Math.abs(sum - totalAmount) > 0.01) return { error: "Amounts must add up to the total." };
  return amounts;
}

export async function createSplit(
  creatorId: number,
  input: {
    title: string;
    totalAmount: number;
    splitMethod: SplitMethod;
    paymentMethod: SplitPaymentMethod;
    date: string;
    participantIds: number[];
    customOwed?: { userId: number; amount: number }[];
    customPaid?: { userId: number; amount: number }[];
  },
): Promise<{ id: number } | { error: string }> {
  await ensureSchema();
  const others = [...new Set(input.participantIds)].filter((id) => id !== creatorId);
  for (const id of others) {
    if (!(await areFriends(creatorId, id))) return { error: "You can only split a bill with friends." };
  }
  const allIds = [creatorId, ...others];

  const owed =
    input.splitMethod === "equal"
      ? splitEqually(input.totalAmount, allIds, creatorId)
      : splitByCustomAmounts(input.totalAmount, allIds, input.customOwed);
  if ("error" in owed) return owed;

  const paid =
    input.paymentMethod === "single_payer"
      ? new Map(allIds.map((id) => [id, id === creatorId ? input.totalAmount : 0]))
      : splitByCustomAmounts(input.totalAmount, allIds, input.customPaid);
  if ("error" in paid) return paid;

  const requireConfirmation = await getRequireSplitConfirmation(creatorId);

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.sql<{ id: number }>`
      INSERT INTO splits (creator_id, title, total_amount, split_method, date)
      VALUES (${creatorId}, ${input.title}, ${input.totalAmount}, ${input.splitMethod}, ${input.date})
      RETURNING id;
    `;
    const splitId = rows[0].id;
    for (const id of allIds) {
      const status = id === creatorId ? "accepted" : requireConfirmation ? "pending" : "accepted";
      await client.sql`
        INSERT INTO split_participants (split_id, user_id, owed_amount, paid_amount, confirm_status)
        VALUES (${splitId}, ${id}, ${owed.get(id)}, ${paid.get(id)}, ${status});
      `;
    }
    await client.query("COMMIT");
    return { id: splitId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getSplit(
  userId: number,
  splitId: number,
): Promise<{ split: SplitRow; participants: SplitParticipantRow[] } | null> {
  await ensureSchema();
  const { rows: splitRows } = await sql<SplitRow>`
    SELECT id, creator_id, title, total_amount::text AS total_amount, split_method,
      to_char(date, 'YYYY-MM-DD') AS date
    FROM splits WHERE id = ${splitId};
  `;
  const split = splitRows[0];
  if (!split) return null;

  const { rows: myRow } = await sql`
    SELECT 1 FROM split_participants WHERE split_id = ${splitId} AND user_id = ${userId};
  `;
  if (!myRow[0]) return null;

  const { rows: participants } = await sql<SplitParticipantRow>`
    SELECT sp.id, sp.user_id, u.username, sp.owed_amount::text AS owed_amount, sp.paid_amount::text AS paid_amount,
      sp.confirm_status, sp.settled, (sp.user_id = ${userId}) AS is_me
    FROM split_participants sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.split_id = ${splitId}
    ORDER BY sp.id;
  `;
  return { split, participants };
}

// Generates the split's share_token on first request and reuses it after
// that — same token for every subsequent "Copy share link" tap, so an
// already-shared link keeps working. Scoped to participants (same access
// check as getSplit) since only someone already in the split should be
// able to mint a public link for it.
export async function getOrCreateSplitShareToken(userId: number, splitId: number): Promise<string | null> {
  await ensureSchema();
  const { rows: myRow } = await sql`
    SELECT 1 FROM split_participants WHERE split_id = ${splitId} AND user_id = ${userId};
  `;
  if (!myRow[0]) return null;

  const { rows: existing } = await sql<{ share_token: string | null }>`
    SELECT share_token FROM splits WHERE id = ${splitId};
  `;
  if (!existing[0]) return null;
  if (existing[0].share_token) return existing[0].share_token;

  const token = randomUUID();
  await sql`UPDATE splits SET share_token = ${token} WHERE id = ${splitId};`;
  return token;
}

// Public, unauthenticated lookup for app/splits/[token]/page.tsx — no
// userId scoping, deliberately: the whole point of the link is that
// someone without a Tally account can view it. Read-only; there's no
// mutating counterpart, so a leaked link can't be used to change anything.
export async function getSplitByShareToken(
  token: string,
): Promise<{ split: SplitRow; participants: SplitParticipantRow[] } | null> {
  await ensureSchema();
  const { rows: splitRows } = await sql<SplitRow>`
    SELECT id, creator_id, title, total_amount::text AS total_amount, split_method,
      to_char(date, 'YYYY-MM-DD') AS date
    FROM splits WHERE share_token = ${token};
  `;
  const split = splitRows[0];
  if (!split) return null;

  const { rows: participants } = await sql<SplitParticipantRow>`
    SELECT sp.id, sp.user_id, u.username, sp.owed_amount::text AS owed_amount, sp.paid_amount::text AS paid_amount,
      sp.confirm_status, sp.settled, false AS is_me
    FROM split_participants sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.split_id = ${split.id}
    ORDER BY sp.id;
  `;
  return { split, participants };
}

export async function respondToSplit(userId: number, splitId: number, accept: boolean): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE split_participants SET confirm_status = ${accept ? "accepted" : "declined"}
    WHERE split_id = ${splitId} AND user_id = ${userId} AND confirm_status = 'pending';
  `;
  return (rowCount ?? 0) > 0;
}

export async function toggleSplitSettled(userId: number, splitId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE split_participants SET settled = NOT settled
    WHERE split_id = ${splitId} AND user_id = ${userId} AND confirm_status = 'accepted';
  `;
  return (rowCount ?? 0) > 0;
}

// Deletes the whole split if the caller created it (cascades every
// participant row), otherwise just removes the caller's own participation.
export async function leaveOrDeleteSplit(userId: number, splitId: number): Promise<void> {
  await ensureSchema();
  const { rows } = await sql<{ creator_id: number }>`SELECT creator_id FROM splits WHERE id = ${splitId};`;
  if (!rows[0]) return;
  if (rows[0].creator_id === userId) {
    await sql`DELETE FROM splits WHERE id = ${splitId};`;
  } else {
    await sql`DELETE FROM split_participants WHERE split_id = ${splitId} AND user_id = ${userId};`;
  }
}

// ---- Recurring splits (a recurring_rules-style template for splits) -------

export type RecurringSplitRow = {
  id: number;
  title: string;
  total_amount: string;
  split_method: SplitMethod;
  participant_ids: number[];
  frequency: string;
  next_run_date: string;
  active: boolean;
};

function parseParticipantIds(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

export async function listRecurringSplits(userId: number): Promise<RecurringSplitRow[]> {
  await ensureSchema();
  const { rows } = await sql<{
    id: number;
    title: string;
    total_amount: string;
    split_method: SplitMethod;
    participant_ids: string;
    frequency: string;
    next_run_date: string;
    active: boolean;
  }>`
    SELECT id, title, total_amount::text AS total_amount, split_method, participant_ids, frequency,
           to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date, active
    FROM recurring_splits WHERE creator_id = ${userId} ORDER BY id DESC;
  `;
  return rows.map((r) => ({ ...r, participant_ids: parseParticipantIds(r.participant_ids) }));
}

export async function createRecurringSplit(
  creatorId: number,
  input: { title: string; totalAmount: number; splitMethod: SplitMethod; participantIds: number[]; frequency: string; startDate: string },
): Promise<{ row: RecurringSplitRow } | { error: string }> {
  await ensureSchema();
  const others = [...new Set(input.participantIds)].filter((id) => id !== creatorId);
  for (const id of others) {
    if (!(await areFriends(creatorId, id))) return { error: "You can only split a bill with friends." };
  }
  const allIds = [creatorId, ...others];
  const { rows } = await sql<{ id: number }>`
    INSERT INTO recurring_splits (creator_id, title, total_amount, split_method, participant_ids, frequency, next_run_date)
    VALUES (${creatorId}, ${input.title}, ${input.totalAmount}, ${input.splitMethod}, ${JSON.stringify(allIds)}, ${input.frequency}, ${input.startDate})
    RETURNING id;
  `;
  const rows2 = await listRecurringSplits(creatorId);
  const row = rows2.find((r) => r.id === rows[0].id);
  return row ? { row } : { error: "Could not create that recurring split." };
}

export async function deleteRecurringSplit(userId: number, id: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM recurring_splits WHERE id = ${id} AND creator_id = ${userId};`;
}

export async function setRecurringSplitActive(userId: number, id: number, active: boolean): Promise<void> {
  await ensureSchema();
  await sql`UPDATE recurring_splits SET active = ${active} WHERE id = ${id} AND creator_id = ${userId};`;
}

// Materializes every due recurring split into a real `splits` row (via the
// same createSplit() a manually-created split goes through — equal-share
// only, single payer = the template's creator, matching the common "I pay
// rent, everyone else owes their share" case), then advances next_run_date
// past today — mirrors processDueRecurringRules' loop for expenses.
export async function processDueRecurringSplits(userId: number): Promise<number> {
  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await sql<{
    id: number;
    title: string;
    total_amount: string;
    split_method: SplitMethod;
    participant_ids: string;
    frequency: string;
    next_run_date: string;
  }>`
    SELECT id, title, total_amount::text AS total_amount, split_method, participant_ids, frequency,
           to_char(next_run_date, 'YYYY-MM-DD') AS next_run_date
    FROM recurring_splits WHERE creator_id = ${userId} AND active = true AND next_run_date <= ${today};
  `;

  let created = 0;
  for (const rule of rows) {
    let nextRunDate = rule.next_run_date;
    // A rule left untouched for a long stretch (app not opened) can be due
    // many times over — catch it up to today in one pass rather than only
    // ever materializing a single occurrence per dashboard load, same
    // safety behavior as processDueRecurringRules.
    while (nextRunDate <= today) {
      const result = await createSplit(userId, {
        title: rule.title,
        totalAmount: Number(rule.total_amount),
        splitMethod: rule.split_method,
        paymentMethod: "single_payer",
        date: nextRunDate,
        participantIds: parseParticipantIds(rule.participant_ids),
      });
      if ("error" in result) break; // e.g. no longer friends with a participant — stop advancing this rule
      created++;
      nextRunDate = advanceDate(nextRunDate, rule.frequency);
    }
    await sql`UPDATE recurring_splits SET next_run_date = ${nextRunDate} WHERE id = ${rule.id};`;
  }
  return created;
}

// Net "who owes whom" across every split and loan with each friend, in one
// pass — combines split_participants (only splits I created, or splits a
// friend created that I'm in — a 3+ person split has no single well-defined
// pairwise debt otherwise, so those are deliberately excluded rather than
// guessed at) and loans (counterparty_friend_id). Positive = they owe me;
// negative = I owe them. Only counts accepted, unsettled split shares —
// a pending (unconfirmed) split isn't a real commitment yet.
export async function getFriendNetBalances(userId: number): Promise<Map<number, number>> {
  await ensureSchema();
  const net = new Map<number, number>();
  const add = (friendId: number, amount: number) => net.set(friendId, (net.get(friendId) ?? 0) + amount);

  const { rows: owedToMe } = await sql<{ friend_id: number; amt: string }>`
    SELECT sp.user_id AS friend_id, SUM(sp.owed_amount - sp.paid_amount) AS amt
    FROM splits s JOIN split_participants sp ON sp.split_id = s.id
    WHERE s.creator_id = ${userId} AND sp.user_id != ${userId} AND sp.confirm_status = 'accepted' AND sp.settled = false
    GROUP BY sp.user_id;
  `;
  for (const r of owedToMe) add(r.friend_id, Number(r.amt));

  const { rows: iOwe } = await sql<{ friend_id: number; amt: string }>`
    SELECT s.creator_id AS friend_id, SUM(sp.owed_amount - sp.paid_amount) AS amt
    FROM splits s JOIN split_participants sp ON sp.split_id = s.id
    WHERE sp.user_id = ${userId} AND s.creator_id != ${userId} AND sp.confirm_status = 'accepted' AND sp.settled = false
    GROUP BY s.creator_id;
  `;
  for (const r of iOwe) add(r.friend_id, -Number(r.amt));

  const { rows: loans } = await sql<{ friend_id: number; direction: "lent" | "borrowed"; principal: string; paid: string }>`
    SELECT l.counterparty_friend_id AS friend_id, l.direction, l.principal::text AS principal,
      COALESCE((SELECT SUM(li.amount) FROM loan_installments li WHERE li.loan_id = l.id AND li.paid = true), 0)::text AS paid
    FROM loans l
    WHERE l.user_id = ${userId} AND l.counterparty_friend_id IS NOT NULL;
  `;
  for (const r of loans) {
    const remaining = Number(r.principal) - Number(r.paid);
    add(r.friend_id, r.direction === "lent" ? remaining : -remaining);
  }

  return net;
}

// ---- Loans (debt tracker) --------------------------------------------------
// See the schema-v25 comment above for why this is a standalone ledger like
// splits, not linked to expenses.

export type LoanListItem = {
  id: number;
  counterparty_friend_id: number | null;
  counterparty_name: string | null;
  counterparty_username: string | null;
  direction: "lent" | "borrowed";
  principal: string;
  notes: string | null;
  created_at: string;
  paid_total: string;
  installment_count: number;
  paid_count: number;
};

export type LoanInstallmentRow = {
  id: number;
  due_date: string;
  amount: string;
  paid: boolean;
  paid_at: string | null;
};

export async function listLoans(userId: number): Promise<LoanListItem[]> {
  await ensureSchema();
  const { rows } = await sql<LoanListItem>`
    SELECT
      l.id,
      l.counterparty_friend_id,
      l.counterparty_name,
      u.username AS counterparty_username,
      l.direction,
      l.principal::text AS principal,
      l.notes,
      l.created_at::text AS created_at,
      COALESCE(SUM(li.amount) FILTER (WHERE li.paid), 0)::text AS paid_total,
      COUNT(li.id)::int AS installment_count,
      COUNT(li.id) FILTER (WHERE li.paid)::int AS paid_count
    FROM loans l
    LEFT JOIN users u ON u.id = l.counterparty_friend_id
    LEFT JOIN loan_installments li ON li.loan_id = l.id
    WHERE l.user_id = ${userId}
    GROUP BY l.id, u.username
    ORDER BY l.created_at DESC;
  `;
  return rows;
}

export async function listLoanInstallments(userId: number, loanId: number): Promise<LoanInstallmentRow[]> {
  await ensureSchema();
  const { rows } = await sql<LoanInstallmentRow>`
    SELECT li.id, to_char(li.due_date, 'YYYY-MM-DD') AS due_date, li.amount::text AS amount, li.paid, li.paid_at::text AS paid_at
    FROM loan_installments li
    JOIN loans l ON l.id = li.loan_id
    WHERE li.loan_id = ${loanId} AND l.user_id = ${userId}
    ORDER BY li.due_date ASC, li.id ASC;
  `;
  return rows;
}

export async function createLoan(
  userId: number,
  input: {
    counterpartyFriendId: number | null;
    counterpartyName: string | null;
    direction: "lent" | "borrowed";
    principal: number;
    notes: string | null;
    installments: { dueDate: string; amount: number }[];
  },
): Promise<{ error: string } | { id: number }> {
  await ensureSchema();
  if (input.counterpartyFriendId !== null && !(await areFriends(userId, input.counterpartyFriendId))) {
    return { error: "You can only link a loan to a friend." };
  }
  const { rows } = await sql<{ id: number }>`
    INSERT INTO loans (user_id, counterparty_friend_id, counterparty_name, direction, principal, notes)
    VALUES (${userId}, ${input.counterpartyFriendId}, ${input.counterpartyName}, ${input.direction}, ${input.principal}, ${input.notes})
    RETURNING id;
  `;
  const loanId = rows[0].id;
  for (const inst of input.installments) {
    await sql`
      INSERT INTO loan_installments (loan_id, due_date, amount)
      VALUES (${loanId}, ${inst.dueDate}, ${inst.amount});
    `;
  }
  return { id: loanId };
}

export async function toggleLoanInstallmentPaid(userId: number, installmentId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE loan_installments li
    SET paid = NOT li.paid, paid_at = CASE WHEN li.paid THEN NULL ELSE now() END
    FROM loans l
    WHERE li.id = ${installmentId} AND li.loan_id = l.id AND l.user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function deleteLoan(userId: number, loanId: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM loans WHERE id = ${loanId} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

// ---- Membership cards -----------------------------------------------------

export type MembershipCardRow = {
  id: number;
  name: string;
  code_value: string;
  code_format: string;
  color: string;
  icon: string | null;
  notes: string | null;
  template: string;
  /** Raw JSON text — see normalizePassFields in membership-templates.ts. */
  fields: string;
  /** Raw JSON text, or null for "use the template's default layout" — see
   * normalizePassLayout in membership-templates.ts. */
  layout: string | null;
  /** Raw JSON text, or null — see parseCardBackground in card-backgrounds.ts. */
  background: string | null;
  /** Manual text-color override, or null for auto-contrast — see cardForegroundFor in card-backgrounds.ts. */
  text_color: string | null;
  has_logo: boolean;
  has_banner: boolean;
  category: string;
};

export async function listMembershipCards(userId: number): Promise<MembershipCardRow[]> {
  await ensureSchema();
  const { rows } = await sql<MembershipCardRow>`
    SELECT id, name, code_value, code_format, color, icon, notes, template, fields, layout, background, text_color, category,
      (logo_image IS NOT NULL) AS has_logo, (banner_image IS NOT NULL) AS has_banner
    FROM membership_cards
    WHERE user_id = ${userId}
    ORDER BY sort_order, id;
  `;
  return rows;
}

export async function createMembershipCard(
  userId: number,
  input: {
    name: string;
    codeValue: string;
    codeFormat: string;
    color: string;
    icon?: string | null;
    notes?: string | null;
    template?: string;
    fields?: Record<string, string>;
    layout?: unknown;
    background?: unknown;
    textColor?: string | null;
    category?: string;
  },
): Promise<MembershipCardRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM membership_cards WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const template = input.template ?? "generic";
  const fields = JSON.stringify(input.fields ?? {});
  const layout = input.layout ? JSON.stringify(input.layout) : null;
  const background = input.background ? JSON.stringify(input.background) : null;
  const category = input.category ?? "membership";
  const { rows } = await sql<MembershipCardRow>`
    INSERT INTO membership_cards (user_id, name, code_value, code_format, color, icon, notes, sort_order, template, fields, layout, background, text_color, category)
    VALUES (${userId}, ${input.name}, ${input.codeValue}, ${input.codeFormat}, ${input.color}, ${input.icon ?? null}, ${input.notes ?? null}, ${nextSort}, ${template}, ${fields}, ${layout}, ${background}, ${input.textColor ?? null}, ${category})
    RETURNING id, name, code_value, code_format, color, icon, notes, template, fields, layout, background, text_color, category,
      (logo_image IS NOT NULL) AS has_logo, (banner_image IS NOT NULL) AS has_banner;
  `;
  return rows[0];
}

export async function updateMembershipCard(
  userId: number,
  id: number,
  input: {
    name?: string;
    codeValue?: string;
    codeFormat?: string;
    color?: string;
    icon?: string | null;
    notes?: string | null;
    template?: string;
    fields?: Record<string, string>;
    layout?: unknown;
    background?: unknown;
    textColor?: string | null;
    category?: string;
  },
): Promise<MembershipCardRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<MembershipCardRow>`
    SELECT id, name, code_value, code_format, color, icon, notes, template, fields, layout, background, text_color, category,
      (logo_image IS NOT NULL) AS has_logo, (banner_image IS NOT NULL) AS has_banner
    FROM membership_cards WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const newName = input.name?.trim() ?? existing.name;
  const newCodeValue = input.codeValue?.trim() ?? existing.code_value;
  const newCodeFormat = input.codeFormat ?? existing.code_format;
  const newColor = input.color ?? existing.color;
  const newIcon = input.icon !== undefined ? input.icon : existing.icon;
  const newNotes = input.notes !== undefined ? input.notes : existing.notes;
  const newTemplate = input.template ?? existing.template;
  const newFields = input.fields !== undefined ? JSON.stringify(input.fields) : existing.fields;
  const newLayout = input.layout !== undefined ? (input.layout ? JSON.stringify(input.layout) : null) : existing.layout;
  const newBackground = input.background !== undefined ? (input.background ? JSON.stringify(input.background) : null) : existing.background;
  const newTextColor = input.textColor !== undefined ? input.textColor : existing.text_color;
  const newCategory = input.category ?? existing.category;

  const { rows } = await sql<MembershipCardRow>`
    UPDATE membership_cards
    SET name = ${newName}, code_value = ${newCodeValue}, code_format = ${newCodeFormat},
        color = ${newColor}, icon = ${newIcon}, notes = ${newNotes},
        template = ${newTemplate}, fields = ${newFields}, layout = ${newLayout}, background = ${newBackground},
        text_color = ${newTextColor}, category = ${newCategory}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, name, code_value, code_format, color, icon, notes, template, fields, layout, background, text_color, category,
      (logo_image IS NOT NULL) AS has_logo, (banner_image IS NOT NULL) AS has_banner;
  `;
  return rows[0];
}

export async function deleteMembershipCard(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM membership_cards WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
}

// Logo (small, top-left) and banner (full-width hero) images — same BYTEA-
// in-Postgres pattern as attachReceiptImage/getReceiptImage on expenses.
export async function attachMembershipLogo(userId: number, id: number, bytes: Buffer, mimeType: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE membership_cards
    SET logo_image = decode(${bytes.toString("hex")}, 'hex'), logo_image_type = ${mimeType}
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function getMembershipLogo(userId: number, id: number): Promise<{ bytes: Buffer; mimeType: string } | null> {
  await ensureSchema();
  const { rows } = await sql<{ hex: string | null; mime: string | null }>`
    SELECT encode(logo_image, 'hex') AS hex, logo_image_type AS mime
    FROM membership_cards
    WHERE id = ${id} AND user_id = ${userId};
  `;
  const row = rows[0];
  if (!row?.hex || !row.mime) return null;
  return { bytes: Buffer.from(row.hex, "hex"), mimeType: row.mime };
}

export async function removeMembershipLogo(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE membership_cards SET logo_image = NULL, logo_image_type = NULL
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function attachMembershipBanner(userId: number, id: number, bytes: Buffer, mimeType: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE membership_cards
    SET banner_image = decode(${bytes.toString("hex")}, 'hex'), banner_image_type = ${mimeType}
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

export async function getMembershipBanner(userId: number, id: number): Promise<{ bytes: Buffer; mimeType: string } | null> {
  await ensureSchema();
  const { rows } = await sql<{ hex: string | null; mime: string | null }>`
    SELECT encode(banner_image, 'hex') AS hex, banner_image_type AS mime
    FROM membership_cards
    WHERE id = ${id} AND user_id = ${userId};
  `;
  const row = rows[0];
  if (!row?.hex || !row.mime) return null;
  return { bytes: Buffer.from(row.hex, "hex"), mimeType: row.mime };
}

export async function removeMembershipBanner(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE membership_cards SET banner_image = NULL, banner_image_type = NULL
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return (rowCount ?? 0) > 0;
}

// Same adjacent-swap approach as moveWallet/moveRecurringRule/moveSavingsGoal.
// Scoped to the moved card's own category so reordering within the Passes
// tab never swaps with a Memberships-tab card that just happens to be
// adjacent in the shared sort_order sequence.
export async function moveMembershipCard(userId: number, id: number, direction: "up" | "down"): Promise<void> {
  await ensureSchema();
  const { rows: categoryRows } = await sql<{ category: string }>`
    SELECT category FROM membership_cards WHERE id = ${id} AND user_id = ${userId};
  `;
  const category = categoryRows[0]?.category;
  if (!category) return;
  const { rows } = await sql<{ id: number; sort_order: number }>`
    SELECT id, sort_order FROM membership_cards WHERE user_id = ${userId} AND category = ${category} ORDER BY sort_order, id;
  `;
  const idx = rows.findIndex((r) => r.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.sql`UPDATE membership_cards SET sort_order = ${b.sort_order} WHERE id = ${a.id} AND user_id = ${userId};`;
    await client.sql`UPDATE membership_cards SET sort_order = ${a.sort_order} WHERE id = ${b.id} AND user_id = ${userId};`;
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// The wallet_cards CRUD that used to live here (listWalletCards,
// createWalletCard, updateWalletCard, deleteWalletCard, moveWalletCard) is
// retired — payment-card visuals are now just fields on `wallets` (see the
// wallets schema migration comments and listWallets/createWallet/
// updateWallet above). The wallet_cards table itself is still there, kept
// only as that migration's data source and a rollback safety net.

