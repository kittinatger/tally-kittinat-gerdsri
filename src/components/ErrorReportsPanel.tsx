"use client";

import { useEffect, useState } from "react";
import { getAppErrors, removeAppError, clearAppErrors, type LoggedError } from "@/lib/error-log";
import { APP_VERSION } from "@/lib/version";

const ISSUE_URL = "https://github.com/kittinatger/tally-kittinat-gerdsri/issues/new";

function reportUrl(entry: LoggedError): string {
  const title = `Error: ${entry.context}`;
  const body = [
    `**What happened:** ${entry.context}`,
    `**Message shown:** ${entry.message}`,
    `**When:** ${new Date(entry.timestamp).toLocaleString()}`,
    `**App version:** ${APP_VERSION}`,
    `**Browser:** ${typeof navigator !== "undefined" ? navigator.userAgent : "unknown"}`,
    "",
    "**Steps to reproduce:**",
    "1. ",
    "",
    "**What I expected instead:**",
    "",
  ].join("\n");
  const params = new URLSearchParams({ title, body });
  return `${ISSUE_URL}?${params.toString()}`;
}

export default function ErrorReportsPanel() {
  const [errors, setErrors] = useState<LoggedError[] | null>(null);

  useEffect(() => {
    // localStorage is synchronous, but reading it directly in the effect body
    // trips the "no setState synchronously in an effect" lint rule — deferring
    // by a microtask keeps the same one-paint-later load behavior as every
    // other Settings panel's fetch-on-mount without that warning.
    Promise.resolve().then(() => setErrors(getAppErrors()));
  }, []);

  function handleDismiss(id: string) {
    removeAppError(id);
    setErrors(getAppErrors());
  }

  function handleClearAll() {
    clearAppErrors();
    setErrors([]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Error reports</h3>
        {errors && errors.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
          >
            Clear all
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        A local record of error messages Tally has shown you recently — nothing here leaves your device unless you
        tap Report on an entry, which opens a pre-filled GitHub issue. See also{" "}
        <a href="/troubleshooting" className="text-navy underline hover:no-underline dark:text-blue-300">
          Troubleshooting
        </a>{" "}
        for common causes and fixes.
      </p>

      {errors === null ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : errors.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No errors logged yet.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {errors.map((entry) => (
            <div key={entry.id} className="rounded-card border border-line bg-surface p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{entry.context}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{entry.message}</p>
                  <p className="mt-1 text-[11px] text-ink-soft">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDismiss(entry.id)}
                  aria-label="Dismiss"
                  className="shrink-0 rounded-full p-1.5 text-ink-soft transition hover:bg-bg-soft hover:text-foreground"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>
              <a
                href={reportUrl(entry)}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
              >
                Report this error
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
