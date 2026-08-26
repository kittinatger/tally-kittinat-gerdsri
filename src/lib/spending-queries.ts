import { sql } from "@vercel/postgres";

// Small, purpose-built aggregate queries for the in-app spending assistant
// (see api/assistant/route.ts) — kept separate from listExpenses(), which
// returns the full unfiltered transaction list for client-side filtering.
// The assistant calls these as Gemini function-calling "tools" instead of
// reasoning over raw numbers itself, so an answer can't be hallucinated —
// every number it states came directly from one of these SQL aggregates.

export type CategorySpending = { category: string; total: number };

export async function getSpendingByCategory(
  userId: number,
  from: string,
  to: string,
  type: "expense" | "income" = "expense",
): Promise<CategorySpending[]> {
  const { rows } = await sql<{ category: string; total: string }>`
    SELECT category, SUM(amount)::text AS total
    FROM expenses
    WHERE user_id = ${userId} AND type = ${type} AND date >= ${from} AND date <= ${to}
    GROUP BY category
    ORDER BY SUM(amount) DESC;
  `;
  return rows.map((r) => ({ category: r.category, total: Number(r.total) }));
}

export async function getSpendingTotal(
  userId: number,
  from: string,
  to: string,
  type: "expense" | "income" = "expense",
): Promise<number> {
  const { rows } = await sql<{ total: string | null }>`
    SELECT SUM(amount)::text AS total
    FROM expenses
    WHERE user_id = ${userId} AND type = ${type} AND date >= ${from} AND date <= ${to};
  `;
  return Number(rows[0]?.total ?? 0);
}

export type MerchantSpending = { merchant: string; total: number; count: number };

export async function getTopMerchants(
  userId: number,
  from: string,
  to: string,
  limit: number = 5,
): Promise<MerchantSpending[]> {
  const boundedLimit = Math.min(Math.max(limit, 1), 20);
  const { rows } = await sql<{ merchant: string; total: string; count: number }>`
    SELECT merchant, SUM(amount)::text AS total, COUNT(*)::int AS count
    FROM expenses
    WHERE user_id = ${userId} AND type = 'expense' AND date >= ${from} AND date <= ${to}
    GROUP BY merchant
    ORDER BY SUM(amount) DESC
    LIMIT ${boundedLimit};
  `;
  return rows.map((r) => ({ merchant: r.merchant, total: Number(r.total), count: r.count }));
}
