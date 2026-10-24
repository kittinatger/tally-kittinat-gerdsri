"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";

const inputClass =
  "w-full rounded-card border border-line bg-bg-soft px-4 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20";

export default function GuestUpgradeCard({ onLogout }: { onLogout: () => void }) {
  const t = useT();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create the account.");
        return;
      }
      // Same user id and session cookie — a refresh is enough to swap this
      // card for the full Account panel.
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border border-navy/30 bg-navy/5 p-4">
        <h3 className="text-base font-semibold text-foreground">{t("guest.title")}</h3>
        <p className="mt-1 text-sm text-ink-soft">{t("guest.desc")}</p>
        <p className="mt-2 text-sm text-ink-soft">{t("guest.limits")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">{t("guest.keepData")}</h3>
        <div>
          <label htmlFor="guest-username" className="mb-1 block text-sm font-semibold text-foreground">
            {t("auth.username")}
          </label>
          <input
            id="guest-username"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-soft">{t("auth.usernameHint")}</p>
        </div>
        <div>
          <label htmlFor="guest-password" className="mb-1 block text-sm font-semibold text-foreground">
            {t("auth.password")}
          </label>
          <input
            id="guest-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && (
          <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-navy px-4 py-2.5 font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {saving ? t("guest.creating") : t("auth.createAccount")}
        </button>
      </form>

      <div className="border-t border-line pt-4">
        {confirmingLogout ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-600 dark:text-red-400">{t("guest.signOutWarning")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {t("guest.signOutConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingLogout(false)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
          >
            {t("guest.signOut")}
          </button>
        )}
      </div>
    </div>
  );
}
