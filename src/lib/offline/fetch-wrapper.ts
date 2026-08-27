import { enqueueMutation } from "./mutation-queue";
import { offlineDbAvailable } from "./db";
import { notifyQueueChanged } from "./sync-manager";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Drop-in replacement for fetch() on mutating requests. Online (or when
// IndexedDB isn't available, e.g. a very old browser): behaves exactly
// like fetch(). Offline: queues the request and returns a synthetic
// Response so existing call sites — which all do
// `const res = await fetch(...); const data = await res.json(); if
// (!res.ok) {...}` — keep working unmodified; they just see
// `{ queued: true }` back where they'd normally see the created/updated
// resource. Every mutating call site in this app should use this instead
// of fetch() directly; GET requests are unaffected (the service worker
// handles offline reads separately — see public/sw.js).
export async function mutateFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const isOnline = typeof navigator === "undefined" || navigator.onLine;

  if (!MUTATING_METHODS.has(method) || isOnline || !offlineDbAvailable()) {
    try {
      return await fetch(url, options);
    } catch (err) {
      // A network error while nominally "online" (navigator.onLine can lag
      // reality) still queues, rather than surfacing a raw failure for
      // something the user can't immediately fix.
      if (MUTATING_METHODS.has(method) && offlineDbAvailable()) {
        return queueAndRespond(url, method, options);
      }
      throw err;
    }
  }

  return queueAndRespond(url, method, options);
}

async function queueAndRespond(url: string, method: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  const contentType = headers.get("Content-Type");
  const body = typeof options.body === "string" ? options.body : options.body != null ? String(options.body) : null;

  await enqueueMutation({ method, url, body, contentType });
  notifyQueueChanged();

  return new Response(JSON.stringify({ queued: true, ok: true }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}
