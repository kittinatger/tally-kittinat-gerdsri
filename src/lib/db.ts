import { sql, db } from "@vercel/postgres";
import { createHash, randomBytes } from "crypto";
import type { ExpenseInput } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { convertAmount } from "@/lib/exchange-rate";
import { normalizeDashboardWidgets, type DashboardWidgetInstance } from "@/lib/dashboard-widgets";

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
const CURRENT_SCHEMA_VERSION = 1;

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

      await sql`UPDATE schema_meta SET version = ${CURRENT_SCHEMA_VERSION};`;
    })();
  }
  return schemaReady;
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
  kind: string;
  currency: string | null;
  is_default: boolean;
  archived: boolean;
  balance: string;
};

export async function listWallets(userId: number, opts: { includeArchived?: boolean } = {}): Promise<WalletRow[]> {
  await ensureSchema();
  const { rows } = opts.includeArchived
    ? await sql<WalletRow>`
        SELECT
          w.id, w.name, w.color, w.kind, w.currency, w.is_default, w.archived,
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
        FROM wallets w
        WHERE w.user_id = ${userId}
        ORDER BY w.archived, w.sort_order, w.id;
      `
    : await sql<WalletRow>`
        SELECT
          w.id, w.name, w.color, w.kind, w.currency, w.is_default, w.archived,
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
        FROM wallets w
        WHERE w.user_id = ${userId} AND w.archived = false
        ORDER BY w.sort_order, w.id;
      `;
  return rows;
}

export async function createWallet(
  userId: number,
  name: string,
  color: string,
  kind: string,
  currency?: string | null,
): Promise<WalletRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM wallets WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<{ id: number; name: string; color: string; kind: string; currency: string | null }>`
    INSERT INTO wallets (user_id, name, color, kind, currency, sort_order)
    VALUES (${userId}, ${name}, ${color}, ${kind}, ${currency ?? null}, ${nextSort})
    RETURNING id, name, color, kind, currency;
  `;
  return { ...rows[0], is_default: false, archived: false, balance: "0" };
}

export async function updateWallet(
  userId: number,
  id: number,
  input: {
    name?: string;
    color?: string;
    kind?: string;
    currency?: string | null;
    isDefault?: boolean;
    archived?: boolean;
    startingBalance?: number;
  },
): Promise<WalletRow | { ok: false; error: string } | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<{
    name: string;
    color: string;
    kind: string;
    currency: string | null;
    is_default: boolean;
    archived: boolean;
  }>`
    SELECT name, color, kind, currency, is_default, archived FROM wallets WHERE id = ${id} AND user_id = ${userId};
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
  const newKind = input.kind ?? existing.kind;
  const newCurrency = input.currency !== undefined ? input.currency : existing.currency;
  const newArchived = input.archived ?? existing.archived;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    if (input.startingBalance !== undefined) {
      await client.sql`
        UPDATE wallets
        SET name = ${newName}, color = ${newColor}, kind = ${newKind}, currency = ${newCurrency},
            archived = ${newArchived}, starting_balance = ${input.startingBalance}, starting_balance_set_at = now()
        WHERE id = ${id} AND user_id = ${userId};
      `;
    } else {
      await client.sql`
        UPDATE wallets
        SET name = ${newName}, color = ${newColor}, kind = ${newKind}, currency = ${newCurrency}, archived = ${newArchived}
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

  const { rows } = await sql<WalletRow>`
    SELECT
      w.id, w.name, w.color, w.kind, w.currency, w.is_default, w.archived,
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
    FROM wallets w
    WHERE w.id = ${id} AND w.user_id = ${userId};
  `;
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
export async function getConvertedRemaining(userId: number): Promise<number> {
  await ensureSchema();
  const enabled = await getConvertWalletBalances(userId);
  if (!enabled) return getRemaining(userId);

  const [appCurrency, wallets] = await Promise.all([getCurrency(userId), listWallets(userId)]);

  let total = 0;
  for (const w of wallets) {
    const balance = Number(w.balance);
    if (!w.currency || w.currency === appCurrency) {
      total += balance;
      continue;
    }
    const converted = await convertAmount(balance, w.currency, appCurrency);
    total += converted ?? balance;
  }
  return total;
}

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
      (e.receipt_image IS NOT NULL) AS has_receipt,
      e.wallet_id,
      w.name AS wallet_name,
      e.split_group_id
    FROM expenses e
    LEFT JOIN wallets w ON w.id = e.wallet_id
    WHERE e.user_id = ${userId}
    ORDER BY e.date DESC, e.id DESC;
  `;
  return rows;
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
    const { rows } = await sql<{ id: number }>`SELECT id FROM wallets WHERE id = ${walletId} AND user_id = ${userId};`;
    if (rows[0]) return rows[0].id;
  }
  const { rows: fallback } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND archived = false ORDER BY is_default DESC, sort_order, id LIMIT 1;
  `;
  return fallback[0]?.id ?? null;
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
      (updated.receipt_image IS NOT NULL) AS has_receipt,
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

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
};

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email FROM users WHERE username = ${username};
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email FROM users WHERE id = ${id};
  `;
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash, email FROM users WHERE lower(email) = lower(${email});
  `;
  return rows[0] ?? null;
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

function hashResetToken(rawToken: string): string {
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

export async function createPasswordResetToken(userId: number): Promise<string> {
  await ensureSchema();
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL;`;
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashResetToken(rawToken)}, ${expiresAt.toISOString()});
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
    WHERE token_hash = ${hashResetToken(rawToken)} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id;
  `;
  return rows[0]?.user_id ?? null;
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
    }
    await sql`UPDATE recurring_rules SET next_run_date = ${nextRunDate} WHERE id = ${rule.id};`;
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

  const { rows } = await sql<SavingsGoalRow>`
    UPDATE savings_goals
    SET name = ${newName}, color = ${newColor}, target_amount = ${newTarget}, current_amount = ${newCurrent}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, name, color, target_amount::text AS target_amount, current_amount::text AS current_amount;
  `;
  return rows[0] ?? null;
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
  for (const line of input.lines) {
    const { rows } = await sql<Expense>`
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
