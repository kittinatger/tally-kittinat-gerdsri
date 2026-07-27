import { sql } from "@vercel/postgres";
import type { ExpenseInput } from "@/lib/validation";

export type Expense = {
  id: number;
  type: string;
  date: string;
  amount: string;
  merchant: string;
  category: string;
  notes: string | null;
};

// Dates and amounts are cast explicitly to text in every query so the
// output format never depends on driver-specific type parsing (which is a
// common source of off-by-one-day bugs with DATE columns).

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
      await sql`INSERT INTO app_settings (id, starting_balance) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;`;

      // User-editable categories. Seeded once with a starter set — this runs
      // exactly once (gated by the flag below) so re-running it later never
      // resurrects a category someone has since deleted.
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
      await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS categories_seeded BOOLEAN NOT NULL DEFAULT false;`;
      const { rows: flagRows } = await sql<{ categories_seeded: boolean }>`
        SELECT categories_seeded FROM app_settings WHERE id = 1;
      `;
      if (!flagRows[0]?.categories_seeded) {
        const defaults: Array<{ type: string; name: string; color: string; sort: number }> = [
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
        for (const d of defaults) {
          await sql`
            INSERT INTO categories (type, name, color, sort_order)
            VALUES (${d.type}, ${d.name}, ${d.color}, ${d.sort})
            ON CONFLICT (type, name) DO NOTHING;
          `;
        }
        await sql`UPDATE app_settings SET categories_seeded = true WHERE id = 1;`;
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

export async function listCategories(): Promise<CategoryRow[]> {
  await ensureSchema();
  const { rows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order
    FROM categories
    ORDER BY type, sort_order, id;
  `;
  return rows;
}

export async function createCategory(type: string, name: string, color: string): Promise<CategoryRow> {
  await ensureSchema();
  const { rows: maxRows } = await sql<{ max: number | null }>`
    SELECT MAX(sort_order) AS max FROM categories WHERE type = ${type};
  `;
  const nextSort = (maxRows[0]?.max ?? -1) + 1;
  const { rows } = await sql<CategoryRow>`
    INSERT INTO categories (type, name, color, sort_order)
    VALUES (${type}, ${name}, ${color}, ${nextSort})
    RETURNING id, type, name, color, sort_order;
  `;
  return rows[0];
}

export async function updateCategory(
  id: number,
  input: { name?: string; color?: string },
): Promise<CategoryRow | null> {
  await ensureSchema();
  const { rows: existingRows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order FROM categories WHERE id = ${id};
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
    WHERE id = ${id}
    RETURNING id, type, name, color, sort_order;
  `;

  if (trimmedName !== undefined && trimmedName !== existing.name) {
    await sql`
      UPDATE expenses SET category = ${newName}
      WHERE type = ${existing.type} AND category = ${existing.name};
    `;
  }

  return rows[0] ?? null;
}

export async function deleteCategory(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  const { rows } = await sql<CategoryRow>`
    SELECT id, type, name, color, sort_order FROM categories WHERE id = ${id};
  `;
  const existing = rows[0];
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.name === "Other") {
    return { ok: false, error: 'The "Other" category can\'t be deleted — it\'s used as the fallback everywhere.' };
  }

  await sql`
    UPDATE expenses SET category = 'Other'
    WHERE type = ${existing.type} AND category = ${existing.name};
  `;
  await sql`DELETE FROM categories WHERE id = ${id};`;
  return { ok: true };
}

export async function getRemaining(): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ remaining: string }>`
    SELECT (
      s.starting_balance + COALESCE((
        SELECT SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE -e.amount END)
        FROM expenses e
        WHERE e.created_at > s.starting_balance_set_at
      ), 0)
    )::text AS remaining
    FROM app_settings s
    WHERE s.id = 1;
  `;
  return rows[0] ? Number(rows[0].remaining) : 0;
}

export async function setRemaining(amount: number): Promise<number> {
  await ensureSchema();
  await sql`
    UPDATE app_settings
    SET starting_balance = ${amount}, starting_balance_set_at = now()
    WHERE id = 1;
  `;
  return amount;
}

export async function listExpenses(): Promise<Expense[]> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes
    FROM expenses
    ORDER BY date DESC, id DESC;
  `;
  return rows;
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    WITH inserted AS (
      INSERT INTO expenses (type, date, amount, merchant, category, notes)
      VALUES (${input.type}, ${input.date}, ${input.amount}, ${input.merchant}, ${input.category}, ${input.notes ?? null})
      RETURNING *
    )
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes
    FROM inserted;
  `;
  return rows[0];
}

export async function updateExpense(id: number, input: ExpenseInput): Promise<Expense | null> {
  await ensureSchema();
  const { rows } = await sql<Expense>`
    WITH updated AS (
      UPDATE expenses
      SET type = ${input.type},
          date = ${input.date},
          amount = ${input.amount},
          merchant = ${input.merchant},
          category = ${input.category},
          notes = ${input.notes ?? null}
      WHERE id = ${id}
      RETURNING *
    )
    SELECT
      id,
      type,
      to_char(date, 'YYYY-MM-DD') AS date,
      amount::text AS amount,
      merchant,
      category,
      notes
    FROM updated;
  `;
  return rows[0] ?? null;
}

export async function deleteExpense(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM expenses WHERE id = ${id};`;
  return (rowCount ?? 0) > 0;
}
