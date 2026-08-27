// Tier 1 (shell caching + offline fallback page) plus Tier 2: stale-while-
// revalidate caching of GET /api/* responses, so previously-viewed data
// (expenses list, wallets, budgets, etc.) still renders while offline
// instead of erroring. Deliberately does NOT intercept mutating requests
// (POST/PUT/PATCH/DELETE) — those are handled in page context by
// src/lib/offline/fetch-wrapper.ts's mutateFetch, which queues them in
// IndexedDB when offline, so normal fetch() cookie/rate-limit semantics
// stay untouched here.

const CACHE_NAME = "tally-shell-v2";
const API_CACHE_NAME = "tally-api-v1";
const SHELL_URLS = ["/offline", "/manifest.json", "/apple-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline").then((res) => res ?? Response.error())));
    return;
  }

  if (req.method === "GET" && new URL(req.url).pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(API_CACHE_NAME);
  const cached = await cache.match(req);

  const networkFetch = fetch(req)
    .then((res) => {
      // Only cache real success responses — a 401 (signed out) or 5xx must
      // never get served back as if it were good data.
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);

  if (cached) {
    // Kick off the refresh but don't wait on it — the user sees cached
    // data immediately, updated silently once the network responds.
    networkFetch;
    return cached;
  }

  const networkRes = await networkFetch;
  return networkRes ?? Response.error();
}
