"use client";

import { useCallback, useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { badgeClasses } from "@/lib/category-styles";
import { useT } from "@/lib/language-context";

type ApiToken = { id: number; name: string; created_at: string; last_used_at: string | null };

function KeyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <circle cx="7" cy="13" r="3.25" />
      <path d="M9.3 10.7 15.5 4.5M13.5 6.5l1.75 1.75M15.75 4.25 17.5 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5" />
    </svg>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-soft text-ink-soft">{icon}</span>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export default function ApiTokensManager() {
  const t = useT();
  const [tokens, setTokens] = useState<ApiToken[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<number | null>(null);

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
    if (confirmRevokeId !== id) {
      setConfirmRevokeId(id);
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (res.ok) setTokens((prev) => (prev ?? []).filter((t) => t.id !== id));
    } finally {
      setBusyId(null);
      setConfirmRevokeId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">{t("tokens.title")}</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          {adding ? t("common.cancel") : t("tokens.newToken")}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        {t("tokens.desc")}
      </p>

      {newToken && (
        <div className="mt-4 rounded-card border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="mb-2 text-sm font-semibold text-foreground">
            {t("tokens.copyNowWarning")}
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-card bg-bg-soft px-3 py-2 font-mono text-xs text-foreground">
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
              className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-soft"
            >
              {copied ? t("tokens.copied") : t("tokens.copy")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewToken(null)}
            className="mt-3 text-xs font-semibold text-ink-soft hover:text-foreground"
          >
            {t("common.done")}
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              {t("tokens.nameLabel")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tokens.namePlaceholder")}
              className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
            >
              {submitting ? t("challenges.creating") : t("tokens.createToken")}
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {tokens === null ? (
        <p className="mt-4 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : tokens.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<KeyIcon />} text={t("tokens.noTokensYet")} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {tokens.map((tok, i) => {
            const confirming = confirmRevokeId === tok.id;
            return (
              <div key={tok.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses("slate")}`}>
                  <KeyIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{tok.name}</p>
                  <p className="text-xs text-ink-soft">
                    {tok.last_used_at ? `${t("tokens.lastUsedPrefix")} ${new Date(tok.last_used_at).toLocaleDateString()}` : t("tokens.neverUsed")}
                  </p>
                </div>
                {confirming ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setConfirmRevokeId(null)}
                      disabled={busyId === tok.id}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => handleRevoke(tok.id)}
                      disabled={busyId === tok.id}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === tok.id ? t("tokens.revoking") : t("tokens.confirmRevoke")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRevoke(tok.id)}
                    disabled={busyId === tok.id}
                    aria-label={`${t("tokens.confirmRevoke")} ${tok.name}`}
                    className="shrink-0 rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
