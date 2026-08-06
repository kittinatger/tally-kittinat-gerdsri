"use client";

import { useCallback, useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";

type ApiToken = { id: number; name: string; created_at: string; last_used_at: string | null };

export default function ApiTokensManager() {
  const [tokens, setTokens] = useState<ApiToken[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refetch = useCallback(() => {
    return fetch("/api/tokens")
      .then((res) => res.json())
      .then((data) => setTokens(data.tokens ?? []))
      .catch(() => setLoadError("Could not load your tokens."));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create that token.");
        return;
      }
      setNewToken(data.token);
      setAdding(false);
      setName("");
      refetch();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (res.ok) setTokens((prev) => (prev ?? []).filter((t) => t.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Access tokens</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? "Cancel" : "New token"}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        A token lets an automation (like an iOS Shortcut) add transactions to your account without signing in.
        Anyone with a token can add transactions on your behalf — treat it like a password.
      </p>

      {newToken && (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            Copy this token now — you won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-card bg-bg-soft px-3 py-2 text-xs text-foreground">
              {newToken}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(newToken).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewToken(null)}
            className="mt-3 text-xs font-semibold text-ink-soft hover:text-foreground"
          >
            Done
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">
              Name (so you remember what it&apos;s for)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone Shortcut"
              className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-base text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create token"}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {tokens === null ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : tokens.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No tokens yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {tokens.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i === tokens.length - 1 ? "" : "border-b border-line"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-ink-soft">
                  {t.last_used_at ? `Last used ${new Date(t.last_used_at).toLocaleDateString()}` : "Never used"}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(t.id)}
                disabled={busyId === t.id}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
