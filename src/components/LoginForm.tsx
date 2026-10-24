"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/language-context";
import GuestButton from "./GuestButton";
import { EyeIcon as PhEyeIcon, EyeSlashIcon as PhEyeSlashIcon, GithubLogoIcon as PhGithubLogoIcon } from "@phosphor-icons/react/dist/ssr";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  github_failed: "GitHub sign-in didn't complete. Please try again.",
  github_not_configured: "GitHub sign-in isn't set up on this deployment.",
};

function EyeIcon({ open }: { open: boolean }) {
  const Glyph = open ? PhEyeIcon : PhEyeSlashIcon;
  return <Glyph weight="fill" aria-hidden="true" className="h-4.5 w-4.5" />;
}

function GithubIcon() {
  return <PhGithubLogoIcon weight="fill" aria-hidden="true" className="h-4 w-4" />;
}

export default function LoginForm({ next, oauthError }: { next: string; oauthError?: string }) {
  const router = useRouter();
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] ?? "Sign-in didn't complete. Please try again.") : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.replace(next || "/");
      router.refresh();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("auth.username")}
          </label>
          <input
            id="username"
            type="text"
            autoFocus
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-card border border-line bg-bg-soft px-4 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
            placeholder={t("auth.enterUsername")}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card border border-line bg-bg-soft px-4 py-2.5 pr-11 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              placeholder={t("auth.enterPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-soft transition hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        {error && (
          <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-navy px-4 py-2.5 font-semibold text-white shadow-soft transition hover:bg-navy-dark active:scale-[0.97] disabled:opacity-60"
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>

      <p className="mt-3 text-center text-sm">
        <Link href="/forgot-password" className="font-semibold text-navy hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </p>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <a
        href="/api/auth/github"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg-soft px-4 py-2.5 font-semibold text-foreground shadow-soft transition hover:bg-[var(--nav-hover-bg)]"
      >
        <GithubIcon />
        {t("auth.continueWithGithub")}
      </a>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t("auth.dontHaveAccount")}{" "}
        <Link href="/register" className="font-semibold text-navy hover:underline">
          {t("auth.signUp")}
        </Link>
      </p>

      <div className="mt-2 text-center">
        <GuestButton next={next} />
      </div>
    </div>
  );
}
