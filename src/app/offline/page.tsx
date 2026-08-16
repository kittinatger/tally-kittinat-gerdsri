"use client";

import { useT } from "@/lib/language-context";

export default function OfflinePage() {
  const t = useT();
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 text-center">
      <img src="/favicon-light.svg" alt="Tally" className="mb-4 h-14 w-14 dark:hidden" />
      <img src="/favicon-dark.svg" alt="Tally" className="mb-4 hidden h-14 w-14 dark:block" />
      <h1 className="font-display text-2xl text-foreground">{t("offline.title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        {t("offline.desc")}
      </p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="mt-6 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
      >
        {t("offline.tryAgain")}
      </button>
    </main>
  );
}
