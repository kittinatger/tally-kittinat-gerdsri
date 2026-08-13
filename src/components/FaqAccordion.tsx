"use client";

import { useMemo, useState } from "react";
import { ChevronIcon, SearchIcon } from "@/lib/icons";

type Faq = { q: string; a: React.ReactNode; keywords?: string };

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [search, setSearch] = useState("");
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

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
          placeholder="Search FAQs..."
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-center text-sm text-ink-soft">
          No FAQs match &quot;{search}&quot;.
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
