import { sql } from "@vercel/postgres";

// Deliberately minimal and free of any Node-only imports (unlike db.ts,
// which pulls in password.ts's use of Node's "crypto" module) — this needs
// to run inside proxy.ts, which executes on the Edge runtime. @vercel/postgres
// itself is edge-safe (HTTP-based), so a plain `sql` query is fine here.

// A DB round trip on every single navigation (this runs in Edge middleware,
// ahead of every authenticated request) was adding real latency across the
// whole app — most requests don't need a fresh answer, since "sign out of
// all devices" is inherently a rare, deliberate action. Caching per user for
// a short window turns nearly every navigation into a free in-memory hit,
// at the cost of revocation taking up to CACHE_TTL_MS to actually kick in.
// Edge isolates get reused across nearby requests (though not guaranteed
// long-lived), so this is a real if imperfect win rather than a no-op.
const CACHE_TTL_MS = 60_000;
const cache = new Map<number, { version: number; expiresAt: number }>();

// No defensive column-creation here (unlike the first version of this file)
// — db.ts's version-gated ensureSchema() now guarantees the column exists
// after the very first request handled in a Node context. If this query
// ever does hit a database that hasn't reached that point yet, the catch
// below fails open exactly like any other transient error.
async function fetchSessionVersion(userId: number): Promise<number | null> {
  try {
    const { rows } = await sql<{ session_version: number }>`
      SELECT session_version FROM users WHERE id = ${userId};
    `;
    return rows[0]?.session_version ?? 0;
  } catch {
    return null;
  }
}

// Any failure here (missing column on first deploy, a transient connection
// hiccup, etc.) must never crash the request: returns null to mean
// "couldn't verify," and proxy.ts treats that as "trust the token's
// signature," same as before session revocation existed, rather than
// 500ing the request.
export async function getSessionVersion(userId: number): Promise<number | null> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.version;
  }

  const version = await fetchSessionVersion(userId);
  if (version !== null) {
    cache.set(userId, { version, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return version;
}
