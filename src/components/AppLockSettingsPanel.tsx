"use client";

import { useEffect, useState } from "react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";

type CredentialInfo = { id: number; deviceLabel: string | null; createdAt: string; lastUsedAt: string | null };

export default function AppLockSettingsPanel() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [supported] = useState(() => (typeof window !== "undefined" ? browserSupportsWebAuthn() : false));

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/webauthn/credentials");
      const data = await res.json();
      if (res.ok) {
        setEnabled(data.enabled);
        setCredentials(data.credentials);
      }
    } catch {
      // Leave the panel in its previous state; the user can retry via the
      // buttons below, which surface their own errors.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load()'s own setLoading(true) is what this effect exists to trigger
    // — same fetch-on-mount pattern used across this app's other settings
    // panels (e.g. LoanManager.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleEnroll() {
    setError(null);
    setEnrolling(true);
    try {
      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error ?? t("appLock.enrollFailed"));
        return;
      }
      const attResp = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error ?? t("appLock.enrollFailed"));
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : describeFetchError(err));
    } finally {
      setEnrolling(false);
    }
  }

  async function handleToggle(next: boolean) {
    setError(null);
    try {
      const res = await fetch("/api/webauthn/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("appLock.toggleFailed"));
        return;
      }
      setEnabled(next);
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  async function handleRemove(id: number) {
    setError(null);
    try {
      const res = await fetch("/api/webauthn/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("appLock.removeFailed"));
        return;
      }
      await load();
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-2xl text-foreground">{t("appLock.title")}</h3>
      <p className="text-xs leading-snug text-ink-soft">{t("appLock.description")}</p>

      {!supported && <p className="text-xs text-amber-600 dark:text-amber-400">{t("appLock.unsupported")}</p>}

      {loading ? (
        <p className="text-xs text-ink-soft">{t("appLock.loading")}</p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-medium text-foreground">{t("appLock.toggleLabel")}</p>
              <p className="text-[11px] leading-snug text-ink-soft">{t("appLock.toggleHint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => handleToggle(!enabled)}
              disabled={credentials.length === 0}
              className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${enabled ? "bg-surface-accent" : "bg-bg-soft"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          <section className="rounded-card border border-line bg-surface p-4">
            <h4 className="text-sm font-semibold text-foreground">{t("appLock.devicesTitle")}</h4>
            {credentials.length === 0 ? (
              <p className="mt-1 text-xs text-ink-soft">{t("appLock.noDevices")}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {credentials.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-input border border-line px-3 py-2">
                    <span className="min-w-0 truncate text-xs text-foreground">{c.deviceLabel ?? t("appLock.unnamedDevice")}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(c.id)}
                      className="shrink-0 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                    >
                      {t("appLock.remove")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrolling || !supported}
              className="mt-4 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
            >
              {enrolling ? t("appLock.enrolling") : t("appLock.addDevice")}
            </button>
          </section>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
