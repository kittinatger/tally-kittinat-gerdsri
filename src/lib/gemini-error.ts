import { ApiError } from "@google/genai";

// Every route that calls Gemini (extract-receipt, extract-voice, and the
// unattended import path in receipt-intake.ts) needs to turn whatever comes
// back from the SDK into something a user can actually act on — this is the
// one place that mapping lives, so all three stay consistent and none of
// them accidentally leak an SDK/internal message to the client again.
//
// Two error shapes reach here:
// 1. `ApiError` — the SDK's own type for an HTTP-level failure, with a
//    real `.status`. Covers auth/config problems (401/403/404), bad input
//    the API itself rejected (400), and overload/rate-limit (429/503).
// 2. A plain `Error` — either one we threw ourselves in gemini.ts (empty
//    response, invalid JSON, unexpected shape — already written for a
//    user, kept as-is), or the SDK's own non-ApiError failure path for
//    non-retryable HTTP errors, which throws a bare
//    "Non-retryable exception <statusText> sending request" with no
//    status code attached — this is the one that must never reach a user
//    verbatim (see the "Bad Request" bug this was written to fix).
const KNOWN_GEMINI_MESSAGES = [
  /model returned an empty response/i,
  /model returned a response that was not valid json/i,
  /unexpected response shape/i,
];

export function describeGeminiError(err: unknown, kind: "image" | "audio"): { message: string; log: boolean } {
  const noun = kind === "image" ? "image" : "recording";
  const retryHint = kind === "image" ? "try a different photo" : "try recording again";

  if (err instanceof ApiError) {
    if (err.status === 429 || err.status === 503) {
      return { message: "Gemini is busy right now. Please try again in a moment.", log: false };
    }
    if (err.status === 400) {
      return {
        message: `Gemini couldn't process that ${noun} — it may be unreadable or corrupted. Please ${retryHint}, or use manual entry instead.`,
        log: true,
      };
    }
    if (err.status === 401 || err.status === 403 || err.status === 404) {
      return {
        message: `${kind === "image" ? "Receipt scanning" : "Voice entry"} isn't available right now. Please use manual entry instead.`,
        log: true,
      };
    }
    return { message: `Gemini had trouble with that ${noun}. Please try again, or use manual entry instead.`, log: true };
  }

  if (err instanceof Error) {
    if (/gemini_api_key/i.test(err.message)) {
      return {
        message: `${kind === "image" ? "Receipt scanning" : "Voice entry"} isn't set up on this deployment. Please use manual entry instead.`,
        log: true,
      };
    }
    if (KNOWN_GEMINI_MESSAGES.some((re) => re.test(err.message))) {
      return { message: err.message, log: false };
    }
    // Catches the SDK's raw "Non-retryable exception ... sending request"
    // (and anything else unrecognized) rather than showing it verbatim.
    return {
      message: `Gemini couldn't process that ${noun}. Please ${retryHint}, or use manual entry instead.`,
      log: true,
    };
  }

  return { message: `Failed to process that ${noun}. Please try again.`, log: true };
}
