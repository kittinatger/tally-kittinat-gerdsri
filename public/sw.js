// Deliberately minimal — Tier 1 offline support only (installable PWA +
// a friendly offline page instead of the browser's own error). No caching
// of dynamic pages or API responses: every real page in this app is
// server-rendered per-request from the database, so caching them here
// would only ever serve stale or wrong data.

const CACHE_NAME = "tally-shell-v1";
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
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline").then((res) => res ?? Response.error())),
  );
});
