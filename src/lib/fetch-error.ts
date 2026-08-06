// Same idea as describeMicError in VoiceRecorder.tsx, generalized to the
// catch block every fetch() call in this app ends with: a rejection there
// can mean several different things, and collapsing them all into one
// "Network error" hides which fix actually applies (reconnect vs. wait and
// retry vs. just try again).
export function describeFetchError(err: unknown): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline. Check your connection and try again.";
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return "That took too long and timed out. Please try again.";
  }
  if (err instanceof TypeError) {
    // fetch() rejects with a plain TypeError for every network-level
    // failure (DNS, connection refused, CORS, mixed content, etc.) without
    // saying which — this is as specific as the browser honestly lets us be.
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}
