import { sql, db } from "@vercel/postgres";
import type { ExpenseInput } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

export type Expense = {
  id: number;
  type: string;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
  tags: string[];
  has_receipt: boolean;
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
];

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

      await bootstrapAdminIfNeeded();
      await hardenMultiUserConstraints();
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

export async function getRemaining(userId: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ remaining: string }>`
    SELECT (
      s.starting_balance + COALESCE((
        SELECT SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE -e.amount END)
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

export async function listExpenses(userId: number): Promise<Expense[]> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes,
      tags,
      (receipt_image IS NOT NULL) AS has_receipt
    FROM expenses
    WHERE user_id = ${userId}
    ORDER BY date DESC, id DESC;
  `;
  return rows;
}

export async function createExpense(userId: number, input: ExpenseInput): Promise<Expense> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    WITH inserted AS (
      INSERT INTO expenses (user_id, type, date, amount, merchant, category, notes, tags)
      VALUES (${userId}, ${input.type}, ${input.date}, ${input.amount}, ${input.merchant}, ${input.category}, ${input.notes ?? null}, ${toPgTextArray(input.tags ?? [])}::text[])
      RETURNING *
    )
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes,
      tags,
      (receipt_image IS NOT NULL) AS has_receipt
    FROM inserted;
  `;
  return rows[0];
}

export async function updateExpense(userId: number, id: number, input: ExpenseInput): Promise<Expense | null> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    WITH updated AS (
      UPDATE expenses
      SET type = ${input.type},
          date = ${input.date},
          amount = ${input.amount},
          merchant = ${input.merchant},
          category = ${input.category},
          notes = ${input.notes ?? null},
          tags = ${toPgTextArray(input.tags ?? [])}::text[]
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    )
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes,
      tags,
      (receipt_image IS NOT NULL) AS has_receipt
    FROM updated;
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
