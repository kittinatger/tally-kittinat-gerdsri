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

// Neither the SDK nor our own retry loop ever bounded how long a single
// generateContent call is allowed to hang — before the lite-model fallback
// existed, a stuck request was still just one stuck request; now a stall on
// MODEL can be followed by a second stall on LITE_MODEL, doubling the
// exposure. Every call sets this via httpOptions.timeout so a request that
// never gets a response is forced to fail (and retry/fall back, or surface
// a clear error) instead of leaving the UI stuck on "analyzing" forever
// with no success and no error either.
export const REQUEST_TIMEOUT_MS = 12_000;

// The one image-generation call in the app (card-pattern generation) has
// no separate lite model to fall back to — see gemini-pattern.ts.
export const IMAGE_MODEL = "gemini-2.5-flash-image";
