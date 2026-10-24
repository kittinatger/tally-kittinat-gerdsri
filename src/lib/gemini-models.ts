// Model ids and request-timeout constant, split out from gemini.ts so
// client components (the new AI settings panel) can show which models
// power each feature without importing gemini.ts itself — that file pulls
// in @google/genai, a server-only SDK that has no business in the client
// bundle.

// A stable alias (rather than a pinned version) so this doesn't go stale the
// same way "gemini-2.5-flash" did — that model was quietly retired for new
// API keys/projects while staying listed in the models API, which is what
// broke scanning/voice entry for weeks with no code change on our end.
export const MODEL = "gemini-flash-latest";

// A lighter, less capable model in the same family — used only as a
// fallback when MODEL is rate-limited, never chosen by default. Gemini's
// free-tier quota is tracked separately per model, so this has its own
// (typically higher) daily allowance under the same API key rather than
// sharing MODEL's — the cheapest way to add headroom without a second
// provider, a paid tier, or any new setup.
export const LITE_MODEL = "gemini-flash-lite-latest";

// How long a single generateContent call may take before it's abandoned
// (passed as httpOptions.timeout, which the SDK also forwards to Google as
// the server-side deadline). This was 12s, which the current "flash" model —
// a thinking model — regularly overran on receipt photos: production logs
// showed scans failing with 504 DEADLINE_EXCEEDED or an AbortError, and since
// timeouts weren't retried, users had to re-upload a photo many times.
export const REQUEST_TIMEOUT_MS = 45_000;

// The lite model is the fast fallback, tried once when MODEL times out or is
// overloaded; it gets a shorter cap so the worst case (one MODEL attempt plus
// one lite attempt) stays well inside the routes' maxDuration.
export const LITE_REQUEST_TIMEOUT_MS = 30_000;

// The one image-generation call in the app (card-pattern generation) has
// no separate lite model to fall back to — see gemini-pattern.ts.
export const IMAGE_MODEL = "gemini-2.5-flash-image";
