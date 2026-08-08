"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  github_failed: "GitHub sign-in didn't complete. Please try again.",
  github_not_configured: "GitHub sign-in isn't set up on this deployment.",
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path
        d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.6 6.7C4.3 8.2 2.5 10.6 2 12c0 0 3.6 7 10 7 2 0 3.7-.6 5.1-1.5M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7-.4.8-1.3 2.2-2.6 3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.21.66.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function LoginForm({ next, oauthError }: { next: string; oauthError?: string }) {
  const router = useRouter();
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
            Username
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
            placeholder="Enter username"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-ink-soft">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-navy hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card border border-line bg-bg-soft px-4 py-2.5 pr-11 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              placeholder="Enter password"
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
          className="w-full rounded-full bg-navy px-4 py-2.5 font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

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
        Continue with GitHub
      </a>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/register" className="font-semibold text-navy hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
