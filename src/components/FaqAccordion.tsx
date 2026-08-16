"use client";

import { useMemo, useState } from "react";
import { ChevronIcon, SearchIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import SupportScreenshot from "@/components/SupportScreenshot";

type Faq = { q: string; a: React.ReactNode; keywords?: string };

export default function FaqAccordion() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const faqs: Faq[] = useMemo(
    () => [
      {
        q: t("faq.q1"),
        keywords: "deploy self-host hosting",
        a: (
          <>
            {t("faq.a1Before")}{" "}
            <a
              href="https://tally-kittinat.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-navy underline hover:no-underline dark:text-blue-300"
            >
              tally-kittinat.vercel.app
            </a>{" "}
            {t("faq.a1After")}
          </>
        ),
      },
      {
        q: t("faq.q2"),
        keywords: "privacy isolated multi-user",
        a: t("faq.a2"),
      },
      {
        q: t("faq.q3"),
        keywords: "gemini api key scan voice",
        a: t("faq.a3"),
      },
      {
        q: t("faq.q4"),
        keywords: "privacy photos recordings gemini",
        a: t("faq.a4"),
      },
      {
        q: t("faq.q5"),
        keywords: "currency conversion multi-currency",
        a: (
          <>
            <p>{t("faq.a5")}</p>
            <SupportScreenshot src="currency.jpg" alt="Settings > Currency panel" />
          </>
        ),
      },
      {
        q: t("faq.q6"),
        keywords: "delete account forgot password reset",
        a: (
          <>
            <p>{t("faq.a6")}</p>
            <SupportScreenshot src="account.jpg" alt="Settings > Account panel" />
          </>
        ),
      },
      {
        q: t("faq.q7"),
        keywords: "wallets transfers recurring budgets savings goals",
        a: (
          <>
            <p>{t("faq.a7")}</p>
            <SupportScreenshot src="wallets.jpg" alt="Settings > Wallets panel" />
          </>
        ),
      },
      {
        q: t("faq.q8"),
        keywords: "automatic import shortcut share sheet token",
        a: (
          <>
            <p>{t("faq.a8")}</p>
            <SupportScreenshot src="automatic-import.jpg" alt="Settings > Automatic import panel" />
          </>
        ),
      },
      {
        q: t("faq.q9"),
        keywords: "license mit github open source",
        a: (
          <>
            {t("faq.a9Before")}{" "}
            <a
              href="https://github.com/kittinatger/tally-kittinat-gerdsri"
              target="_blank"
              rel="noreferrer"
              className="text-navy underline hover:no-underline dark:text-blue-300"
            >
              GitHub
            </a>
            .
          </>
        ),
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs.map((faq, i) => ({ faq, i }));
    return faqs
      .map((faq, i) => ({ faq, i }))
      .filter(({ faq }) => `${faq.q} ${faq.keywords ?? ""}`.toLowerCase().includes(q));
  }, [faqs, search]);

  function toggle(i: number) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div>
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("faq.searchPlaceholder")}
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-center text-sm text-ink-soft">
          {t("faq.noMatchPrefix")} &quot;{search}&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {filtered.map(({ faq, i }, idx) => {
            const open = openSet.has(i);
            return (
              <div key={faq.q} className={idx === filtered.length - 1 ? "" : "border-b border-line"}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[var(--nav-hover-bg)]"
                >
                  <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                  <ChevronIcon className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <div className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
