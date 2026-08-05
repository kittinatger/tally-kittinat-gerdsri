import { sql } from "@vercel/postgres";

// Deliberately minimal and free of any Node-only imports (unlike db.ts,
// which pulls in password.ts's use of Node's "crypto" module) — this needs
// to run inside proxy.ts, which executes on the Edge runtime. @vercel/postgres
// itself is edge-safe (HTTP-based), so a plain `sql` query is fine here.
export async function getSessionVersion(userId: number): Promise<number> {
  const { rows } = await sql<{ session_version: number }>`
    SELECT session_version FROM users WHERE id = ${userId};
  `;
  return rows[0]?.session_version ?? 0;
}
