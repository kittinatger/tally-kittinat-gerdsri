// public/sw.js caches every GET /api/* response (stale-while-revalidate,
// cache name "tally-api-v1") so previously-viewed data still renders
// offline. It deliberately never intercepts mutating requests (POST/PUT/
// PATCH/DELETE), so a mutation that replaces what a GET endpoint returns
// — e.g. re-uploading a pass's logo/banner at the same URL — leaves the
// old response sitting in that cache with nothing to invalidate it. The
// next GET at that URL then serves the stale cached bytes first (that's
// what stale-while-revalidate means), refreshing the cache only for
// whichever view happens *after* that one. For a JSON list endpoint a
// moment of staleness barely registers; for an image, it read as "my
// crop didn't save" since the same old picture kept reappearing.
//
// The Cache Storage API is available from page context too, not just the
// service worker — so a call site can reach into that same named cache
// right after a successful mutation and evict the one entry it knows is
// now wrong, without needing to touch the service worker at all.
const API_CACHE_NAME = "tally-api-v1";

export async function invalidateApiCache(path: string): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(API_CACHE_NAME);
    await cache.delete(new URL(path, window.location.origin).toString());
  } catch {
    // Best-effort — worst case the next view is briefly stale again, same
    // as before this existed. Not worth surfacing an error for.
  }
}
