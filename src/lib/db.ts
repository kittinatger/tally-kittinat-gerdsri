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
    })();
  }
  return schemaReady;
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
