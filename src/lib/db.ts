import { sql, db } from "@vercel/postgres";
import type { ExpenseInput } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

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

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
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
      await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`;

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

      await bootstrapAdminIfNeeded();
      await hardenMultiUserConstraints();

      // Every account that existed before wallets shipped needs a default
      // wallet seeded (registration seeds one for brand-new accounts going
      // forward — see seedDefaultWalletForUser), and any of their expenses
      // left without a wallet_id get assigned to it.
      await sql`
        INSERT INTO wallets (user_id, name, color, sort_order)
        SELECT u.id, 'Cash', 'slate', 0 FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = u.id);
      `;
      await sql`
        UPDATE expenses e
        SET wallet_id = w.id
        FROM wallets w
        WHERE e.wallet_id IS NULL AND w.user_id = e.user_id AND w.sort_order = 0;
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
    })();
  }
  return schemaReady;
}

export type CategoryRow = {
  id: number;
  type: string;
  name: string;
  color: string;
  sort_order: number;
};

export async function listCategories(userId: number): Promise<CategoryRow[]> {
  await ensureSchema();
  const { rows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order
    FROM categories
    WHERE user_id = ${userId}
    ORDER BY type, sort_order, id;
  `;
  return rows;
}

export async function createCategory(userId: number, type: string, name: string, color: string): Promise<CategoryRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM categories WHERE user_id = ${userId} AND type = ${type};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<CategoryRow>`
    INSERT INTO categories (user_id, type, name, color, sort_order)
    VALUES (${userId}, ${type}, ${name}, ${color}, ${nextSort})
    RETURNING id, type, name, color, sort_order;
  `;
  return rows[0];
}

export async function updateCategory(
  userId: number,
  id: number,
  input: { name?: string; color?: string },
): Promise<CategoryRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order FROM categories WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const trimmedName = input.name?.trim();
  if (existing.name === "Other" && trimmedName !== undefined && trimmedName !== "Other") {
    throw new Error('The "Other" category can\'t be renamed — it\'s used as the fallback everywhere.');
  }

  const newName = trimmedName ?? existing.name;
  const newColor = input.color ?? existing.color;

  const { rows } = await sql<CategoryRow>`
    UPDATE categories
    SET name = ${newName}, color = ${newColor}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, type, name, color, sort_order;
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
  balance: string;
};

export async function listWallets(userId: number): Promise<WalletRow[]> {
  await ensureSchema();
  const { rows } = await sql<WalletRow>`
    SELECT
      w.id,
      w.name,
      w.color,
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
    ORDER BY w.sort_order, w.id;
  `;
  return rows;
}

export async function createWallet(userId: number, name: string, color: string): Promise<WalletRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM wallets WHERE user_id = ${userId};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<{ id: number; name: string; color: string }>`
    INSERT INTO wallets (user_id, name, color, sort_order)
    VALUES (${userId}, ${name}, ${color}, ${nextSort})
    RETURNING id, name, color;
  `;
  return { ...rows[0], balance: "0" };
}

export async function updateWallet(
  userId: number,
  id: number,
  input: { name?: string; color?: string; startingBalance?: number },
): Promise<WalletRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<{ name: string; color: string }>`
    SELECT name, color FROM wallets WHERE id = ${id} AND user_id = ${userId};
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const newName = input.name?.trim() ?? existing.name;
  const newColor = input.color ?? existing.color;

  if (input.startingBalance !== undefined) {
    await sql`
      UPDATE wallets
      SET name = ${newName}, color = ${newColor}, starting_balance = ${input.startingBalance}, starting_balance_set_at = now()
      WHERE id = ${id} AND user_id = ${userId};
    `;
  } else {
    await sql`
      UPDATE wallets SET name = ${newName}, color = ${newColor} WHERE id = ${id} AND user_id = ${userId};
    `;
  }

  const { rows } = await sql<WalletRow>`
    SELECT
      w.id, w.name, w.color,
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

  const { rows: fallbackRows } = await sql<{ id: number }>`
    SELECT id FROM wallets WHERE user_id = ${userId} AND id != ${id} ORDER BY sort_order, id LIMIT 1;
  `;
  const fallbackId = fallbackRows[0]?.id;
  if (!fallbackId) {
    return { ok: false, error: "You need at least one wallet." };
  }

  await sql`UPDATE expenses SET wallet_id = ${fallbackId} WHERE wallet_id = ${id} AND user_id = ${userId};`;
  await sql`DELETE FROM wallets WHERE id = ${id} AND user_id = ${userId};`;
  return { ok: true };
}

export async function seedDefaultWalletForUser(userId: number): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO wallets (user_id, name, color, sort_order)
    SELECT ${userId}, 'Cash', 'slate', 0
    WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = ${userId});
  `;
}

export async function getRemaining(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ remaining: string }>`
    SELECT (
      s.starting_balance + COALESCE((
        SELECT SUM(
          CASE
            WHEN e.type = 'income' THEN e.amount
            WHEN e.type = 'transfer' AND e.direction = 'in' THEN e.amount
            ELSE -e.amount
          END
        )
        FROM expenses e
        WHERE e.user_id = ${userId} AND e.created_at > s.starting_balance_set_at
      ), 0)
    )::text AS remaining
    FROM app_settings s
    WHERE s.user_id = ${userId};
  `;
  return rows[0] ? Number(rows[0].remaining) : 0;
}

export async function setRemaining(userId: number, amount: number): Promise<number> {
  await ensureSchema();
  await sql`
    UPDATE app_settings
    SET starting_balance = ${amount}, starting_balance_set_at = now()
    WHERE user_id = ${userId};
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
      w.name AS wallet_name
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
    SELECT id FROM wallets WHERE user_id = ${userId} ORDER BY sort_order, id LIMIT 1;
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
      w.name AS wallet_name
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
      w.name AS wallet_name
    FROM updated
    LEFT JOIN wallets w ON w.id = updated.wallet_id;
  `;
  return rows[0] ?? null;
}

export async function deleteExpense(userId: number, id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM expenses WHERE id = ${id} AND user_id = ${userId};`;
  return (rowCount ?? 0) > 0;
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
};

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash FROM users WHERE username = ${username};
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureSchema();
  const { rows } = await sql<UserRow>`
    SELECT id, username, password_hash FROM users WHERE id = ${id};
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

export async function updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId};`;
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
