import { sql } from "@vercel/postgres";

// Deliberately minimal and free of any Node-only imports (unlike db.ts,
// which pulls in password.ts's use of Node's "crypto" module) — this needs
// to run inside proxy.ts, which executes on the Edge runtime. @vercel/postgres
// itself is edge-safe (HTTP-based), so a plain `sql` query is fine here.
//
// This bypasses db.ts's ensureSchema() entirely (Edge middleware runs
// before any Node-context route/page code, so ensureSchema() may never
// have executed yet against a freshly-deployed database) — so it runs its
// own defensive column-creation first. And because this runs on *every*
// authenticated request, any failure here (missing column on first deploy,
// a transient connection hiccup, etc.) must never crash the request: it
// returns null to mean "couldn't verify," and proxy.ts treats that as
// "trust the token's signature," same as before session revocation
// existed, rather than 500ing the whole app.
export async function getSessionVersion(userId: number): Promise<number | null> {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;`;
    const { rows } = await sql<{ session_version: number }>`
      SELECT session_version FROM users WHERE id = ${userId};
    `;
    return rows[0]?.session_version ?? 0;
  } catch {
    return null;
  }
}
