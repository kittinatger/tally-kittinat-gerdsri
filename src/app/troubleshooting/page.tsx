import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import BackToSettingsLink from "@/components/BackToSettingsLink";

type Entry = { error: string; what: string; why: string; fix: string };
type Group = { heading: string; entries: Entry[] };

const GROUPS: Group[] = [
  {
    heading: "Voice entry & microphone",
    entries: [
      {
        error: "Microphone access is blocked.",
        what: "Tapping the mic button didn't start recording.",
        why: "Your browser or device has microphone permission denied for Tally.",
        fix: "Enable microphone access for this site in your browser or device settings, then try again. In Settings > Permissions you can also request it directly.",
      },
      {
        error: "No microphone was found on this device.",
        what: "The mic button failed immediately.",
        why: "The browser couldn't detect any microphone hardware.",
        fix: "Check that a microphone is connected (or built-in mic isn't disabled), then retry. Use manual entry as a fallback.",
      },
      {
        error: "Your microphone is already in use by another app.",
        what: "Recording wouldn't start.",
        why: "Another app or browser tab has an active claim on the microphone.",
        fix: "Close the other app/tab using the mic (video calls are a common culprit), then try again.",
      },
      {
        error: "Microphone access requires a secure (HTTPS) connection.",
        what: "Recording is unavailable.",
        why: "Browsers only allow microphone access on HTTPS (or localhost) — this page loaded over plain HTTP.",
        fix: "Only relevant to self-hosted deployments running without HTTPS. Deploy behind HTTPS; see the README's security notes.",
      },
      {
        error: "Gemini couldn't process that recording.",
        what: "The recording uploaded, but the transcription/extraction step failed.",
        why: "Gemini rejected the audio — often too short, silent, or an unusual format.",
        fix: "Try recording again with a clearer, longer description, or switch to manual entry.",
      },
      {
        error: "The model returned an empty response.",
        what: "Same as above — no transaction came back from the recording.",
        why: "Gemini had nothing usable to extract from what it heard.",
        fix: "Re-record and speak clearly, including an amount and merchant/source.",
      },
    ],
  },
  {
    heading: "Receipt scanning & photos",
    entries: [
      {
        error: "Gemini couldn't process that image.",
        what: "A scanned photo failed to extract.",
        why: "The image may be blurry, cropped oddly, or in a format Gemini's API doesn't accept in this environment.",
        fix: "Try a clearer, well-lit photo, or a different format (Tally auto-converts HEIC photos before upload, but a re-take often helps too). Manual entry always works.",
      },
      {
        error: "Unsupported image type.",
        what: "A file was rejected before it was even sent to Gemini.",
        why: "Only JPEG, PNG, WEBP, and HEIC/HEIF are accepted.",
        fix: "Export or re-save the photo as JPEG/PNG and try again.",
      },
      {
        error: "Image is too large (max 8MB).",
        what: "The upload was rejected for size.",
        why: "Full-resolution camera photos can exceed 8MB.",
        fix: "Tally automatically downsizes photos before upload in most cases; if this still happens, try a lower camera resolution or crop the image first.",
      },
      {
        error: "None of those files could be used.",
        what: "Bulk photo selection resulted in nothing to scan.",
        why: "Every selected file failed the type or size check (the message says which).",
        fix: "Re-select using JPEG/PNG/WEBP/HEIC files under 8MB each.",
      },
      {
        error: "Receipt scanning isn't available right now.",
        what: "Scanning fails immediately, every time.",
        why: "A deployment configuration problem (missing/invalid Gemini API key) — not something fixable from the app itself.",
        fix: "Use manual entry. If you run your own deployment, check GEMINI_API_KEY in your environment variables.",
      },
      {
        error: "Could not save that image.",
        what: "Attaching a receipt photo to an existing transaction failed.",
        why: "A server-side error while saving — the transaction itself is unaffected.",
        fix: "Try attaching again in a moment. If it keeps failing, report it — see Error log in Settings.",
      },
    ],
  },
  {
    heading: "Gemini availability & limits",
    entries: [
      {
        error: "Gemini is busy right now.",
        what: "A scan or recording failed with this message.",
        why: "Gemini's API is temporarily overloaded or rate-limiting requests.",
        fix: "Wait a moment and try again — this is transient, not something wrong with your input.",
      },
      {
        error: "Daily scan limit reached.",
        what: "Scanning or voice entry stopped working for the rest of the day.",
        why: "A per-account daily cap on Gemini calls, to bound cost from runaway/scripted usage.",
        fix: "Use manual entry for the rest of the day; the limit resets after 24 hours.",
      },
    ],
  },
  {
    heading: "Network & connectivity",
    entries: [
      {
        error: "You're offline.",
        what: "An action failed instantly.",
        why: "Your device has no network connection.",
        fix: "Reconnect and try again. Tally can be installed for a graceful offline page, but doesn't support offline data entry yet.",
      },
      {
        error: "That took too long and timed out.",
        what: "An action hung, then failed.",
        why: "The request was aborted after taking too long — usually a slow or unstable connection.",
        fix: "Check your connection and try again.",
      },
      {
        error: "Couldn't reach the server.",
        what: "An action failed without a specific server response.",
        why: "A connection-level failure (DNS, blocked request, etc.) that the browser doesn't detail further.",
        fix: "Check your connection; if it persists on a stable connection, report it — see Error log in Settings.",
      },
      {
        error: "Too many requests. Slow down and try again shortly.",
        what: "Several actions in a row suddenly started failing.",
        why: "A short-term rate limit protecting the app from being hammered by one account.",
        fix: "Wait about 10 seconds and try again — normal use rarely hits this.",
      },
    ],
  },
  {
    heading: "Account & sign-in",
    entries: [
      {
        error: "Incorrect username or password.",
        what: "Login failed.",
        why: "Exactly what it says — but shown identically whether the username exists or not, so it can't be used to check which usernames are registered.",
        fix: "Double-check your username/password, or use \"Forgot password?\" if you've set an email on the account.",
      },
      {
        error: "Too many attempts. Try again later.",
        what: "Login stopped accepting attempts.",
        why: "Rate limiting after repeated failed logins for that username, to slow down password guessing.",
        fix: "Wait 15 minutes, or use \"Forgot password?\" if you have an email set on the account.",
      },
      {
        error: "That username is already taken.",
        what: "Registration or a username change was rejected.",
        why: "Someone (possibly you, on an earlier attempt) already has that exact username.",
        fix: "Pick a different username, or sign in instead if the account is yours.",
      },
      {
        error: "That reset link is invalid or has expired.",
        what: "A password reset link didn't work.",
        why: "Reset links expire after 1 hour and are single-use — requesting a new one invalidates any older link.",
        fix: "Go back to \"Forgot password?\" and request a fresh link.",
      },
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2">
        <BackToSettingsLink />
        <h2 className="mb-1 font-display text-2xl text-foreground">Troubleshooting</h2>
        <p className="mb-5 text-sm text-ink-soft">
          Common error messages Tally can show, what they mean, and how to fix or work around them. See also{" "}
          <Link href="/settings" className="text-navy underline hover:no-underline dark:text-blue-300">
            Settings &gt; Error log
          </Link>{" "}
          for a record of what you&apos;ve actually run into.
        </p>

        <div className="space-y-6">
          {GROUPS.map((group) => (
            <section key={group.heading} className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-3 font-display text-lg text-foreground">{group.heading}</h3>
              <div className="space-y-4">
                {group.entries.map((entry) => (
                  <div key={entry.error} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <p className="font-mono text-xs font-semibold text-foreground">&ldquo;{entry.error}&rdquo;</p>
                    <dl className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-soft">
                      <div>
                        <dt className="inline font-semibold text-ink-soft">What happened: </dt>
                        <dd className="inline">{entry.what}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink-soft">Why: </dt>
                        <dd className="inline">{entry.why}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink-soft">Fix or bypass: </dt>
                        <dd className="inline">{entry.fix}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/settings" className="text-navy hover:underline dark:text-blue-300">
            Back to Settings
          </Link>
        </p>
      </main>
    </div>
  );
}
