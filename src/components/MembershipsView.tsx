"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery, DESKTOP_QUERY } from "@/lib/use-media-query";
import { useT } from "@/lib/language-context";
import { heroGradientClasses } from "@/lib/category-styles";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, PlusIcon } from "@/lib/icons";
import { describeFetchError } from "@/lib/fetch-error";
import AppHeader from "./AppHeader";
import Modal from "./Modal";
import MembershipCardCode from "./MembershipCardCode";
import MembershipCardDetail from "./MembershipCardDetail";
import { TEMPLATE_FIELDS, defaultLayoutFor } from "@/lib/membership-templates";
import type { MembershipCard } from "@/types/membership";
import type { MembershipCodeFormat } from "@/lib/memberships";
import type { MessageKey } from "@/lib/i18n/messages";

// Neither is ever mounted on first paint (both require a tap first) —
// loading on demand keeps them out of the initial bundle, same reasoning as
// ActivitiesView's dynamic imports.
const MembershipCardModal = dynamic(() => import("./MembershipCardModal"), { ssr: false });
const ScanCardModal = dynamic(() => import("./ScanCardModal"), { ssr: false });

export default function MembershipsView({ initialCards }: { initialCards: MembershipCard[] }) {
  const t = useT();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [cards, setCards] = useState<MembershipCard[]>(initialCards);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; card: MembershipCard } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedValue, setScannedValue] = useState<{ value: string; format: MembershipCodeFormat } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = cards.find((c) => c.id === selectedId) ?? null;

  function handleSaved(card: MembershipCard) {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    setSelectedId(card.id);
    setModal(null);
    setScannedValue(null);
  }

  function openAdd() {
    setScannedValue(null);
    setModal({ mode: "add" });
  }

  // Closes the detail view (mobile sheet or desktop pane) before opening the
  // edit modal, matching ActivitiesView's edit-from-detail behavior — avoids
  // two modals stacked at once. handleSaved re-selects the card afterward.
  function handleEditFromDetail(card: MembershipCard) {
    setSelectedId(null);
    setModal({ mode: "edit", card });
  }

  function handleScanRequested() {
    setModal(null);
    setScanOpen(true);
  }

  function handleScanned(result: { value: string; format: MembershipCodeFormat }) {
    setScanOpen(false);
    setScannedValue(result);
    setModal({ mode: "add" });
  }

  // Called only after MembershipCardDetail's own two-click confirm has
  // already happened — see the comment on that component.
  async function handleDelete(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : t("membership.couldNotDelete"));
        return;
      }
      setCards((prev) => prev.filter((c) => c.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10 lg:max-w-6xl">
      <AppHeader />

      <main className="flex-1 px-1 py-6 sm:px-2 lg:flex lg:items-start lg:gap-6">
        <div className="lg:w-[420px] lg:shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-foreground">{t("membership.title")}</h2>
              <p className="mt-0.5 text-sm text-ink-soft">{t("membership.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              aria-label={t("membership.addCard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
            >
              <PlusIcon className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {cards.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">{t("membership.emptyTitle")}</p>
              <p className="text-xs text-ink-soft">{t("membership.emptyDesc")}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {cards.map((card) => {
                const isSelected = isDesktop && selected?.id === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedId(card.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left text-white shadow-soft transition ${heroGradientClasses(card.color)} ${
                      isSelected ? "ring-2 ring-navy ring-offset-2 ring-offset-background" : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                      {card.icon && isCategoryIconKey(card.icon) ? (
                        <CategoryIcon iconKey={card.icon} className="h-4.5 w-4.5" />
                      ) : (
                        <span className="text-sm font-semibold">{card.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{card.name}</span>
                      <span className="block truncate text-xs text-white/70">{cardSubtitle(card, t)}</span>
                    </span>
                    <MembershipCardCode value={card.codeValue} format={card.codeFormat} size="thumb" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop-only right pane — below lg: tapping a card opens the
            full-bleed mobile modal instead (see isDesktop guard below), so
            this stays out of the DOM on mobile/tablet. */}
        <div className="hidden lg:sticky lg:top-20 lg:block lg:flex-1">
          {selected ? (
            <div className="rounded-card border border-surface-line bg-surface p-5 sm:p-6">
              <MembershipCardDetail
                key={selected.id}
                card={selected}
                onEdit={() => handleEditFromDetail(selected)}
                onDelete={() => handleDelete(selected.id)}
              />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-surface-line px-6 text-center">
              <p className="text-sm font-medium text-foreground">{t("membership.noCardSelected")}</p>
              <p className="text-xs text-ink-soft">{t("membership.noCardSelectedDesc")}</p>
            </div>
          )}
        </div>
      </main>

      {selected && !isDesktop && (
        <Modal onClose={() => setSelectedId(null)} title={selected.name}>
          <MembershipCardDetail
            key={selected.id}
            card={selected}
            onEdit={() => handleEditFromDetail(selected)}
            onDelete={() => handleDelete(selected.id)}
          />
        </Modal>
      )}

      {modal && (
        <MembershipCardModal
          card={modal.mode === "edit" ? modal.card : undefined}
          scannedValue={modal.mode === "add" ? scannedValue : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onScanRequested={handleScanRequested}
        />
      )}

      {scanOpen && <ScanCardModal onClose={() => setScanOpen(false)} onScanned={handleScanned} />}
    </div>
  );
}

const FORMAT_LABEL_KEYS = {
  qr: "membership.formatQr",
  code128: "membership.formatCode128",
  ean13: "membership.formatEan13",
  upc: "membership.formatUpc",
  pdf417: "membership.formatPdf417",
  aztec: "membership.formatAztec",
} as const;

// The first field with a value, in the template's default zone order —
// gives the compact list row a glance-able detail (a points balance, an
// event date) instead of just the generic code-format label every card
// used to share.
function cardSubtitle(card: MembershipCard, t: (key: MessageKey) => string): string {
  const layout = card.layout ?? defaultLayoutFor(card.template);
  const fieldByKey = Object.fromEntries(TEMPLATE_FIELDS[card.template].map((f) => [f.key, f]));
  for (const zone of ["header", "primary", "secondary", "auxiliary"] as const) {
    for (const key of layout[zone] ?? []) {
      if (!key) continue;
      const def = fieldByKey[key];
      const value = card.fields[key];
      if (def && value) return `${t(def.labelKey)}: ${value}`;
    }
  }
  return t(FORMAT_LABEL_KEYS[card.codeFormat]);
}
