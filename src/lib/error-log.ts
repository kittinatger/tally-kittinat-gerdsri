"use client";

// A small, local (never sent anywhere on its own) log of error messages the
// app has actually shown this user, so Settings > Error reports can list
// what happened recently and let them attach real details to a bug report
// instead of trying to recall/retype the message from memory. Lives in
// localStorage only — nothing here is transmitted unless the user
// explicitly taps "Report" on an entry.

export type LoggedError = {
  id: string;
  timestamp: number;
  context: string;
  message: string;
};

const STORAGE_KEY = "tally-error-log";
const MAX_ENTRIES = 25;

function readAll(): LoggedError[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: LoggedError[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable (private browsing, quota) — the app keeps
    // working either way, just without a persisted log.
  }
}

// `context` identifies where the error surfaced (e.g. "Scan document",
// "Microphone") so the list is scannable without reading every message.
export function logAppError(context: string, message: string): void {
  if (typeof window === "undefined") return;
  const entries = readAll();
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    context,
    message,
  });
  writeAll(entries.slice(0, MAX_ENTRIES));
}

export function getAppErrors(): LoggedError[] {
  return readAll();
}

export function removeAppError(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function clearAppErrors(): void {
  writeAll([]);
}
