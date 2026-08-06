// Edge-safe, in-memory, per-isolate rate limit for mutating API requests
// (POST/PUT/PATCH/DELETE) — same "real if imperfect" tradeoff as the
// session-version cache in session-version.ts: an Edge isolate can be reused
// across nearby requests but isn't guaranteed to stick around, so this isn't
// a hard guarantee across every instance. It's still a real first line of
// defense against a single client hammering the write API, without adding a
// DB round trip to every mutating request app-wide (login/forgot-password/
// Gemini scans use a DB-backed limiter instead, since those are low-frequency
// and specifically need to hold across instances).
const WINDOW_MS = 10_000;
const MAX_MUTATIONS_PER_WINDOW = 30;
const hits = new Map<number, number[]>();

export function checkMutationRateLimit(userId: number): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_MUTATIONS_PER_WINDOW) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}
