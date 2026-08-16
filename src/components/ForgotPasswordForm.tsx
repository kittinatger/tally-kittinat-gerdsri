"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/language-context";

export default function ForgotPasswordForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("auth.somethingWentWrong"));
        return;
      }
      setSent(true);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-foreground">
          {t("forgotPassword.sentPrefix")} <span className="font-semibold">{email}</span> {t("forgotPassword.sentSuffix")}
        </p>
        <p className="text-sm text-ink-soft">{t("forgotPassword.checkInbox")}</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-navy hover:underline">
          {t("forgotPassword.backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-soft">
          {t("account.email")}
        </label>
        <input
          id="email"
          type="email"
          autoFocus
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-card border border-line bg-bg-soft px-4 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          placeholder={t("forgotPassword.emailPlaceholder")}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          {t("forgotPassword.emailHint")}
        </p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-navy px-4 py-2.5 font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
      >
        {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
      </button>
      <p className="text-center text-sm text-ink-soft">
        <Link href="/login" className="font-semibold text-navy hover:underline">
          {t("forgotPassword.backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
