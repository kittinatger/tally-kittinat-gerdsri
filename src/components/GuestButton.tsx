"use client";

import { useState } from "react";
import { useT } from "@/lib/language-context";
import { describeFetchError } from "@/lib/fetch-error";

export default function GuestButton({ next, className }: { next: string; className?: string }) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not start a guest session.");
        setLoading(false);
        return;
      }
      const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.assign(dest);
    } catch (err) {
      setError(describeFetchError(err));
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "w-full rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-foreground disabled:opacity-60"
        }
      >
        {loading ? t("auth.startingGuest") : t("auth.continueAsGuest")}
      </button>
      {error && <p className="mt-1 text-center text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
