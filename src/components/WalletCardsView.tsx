"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import { PlusIcon, EditIcon, TrashIcon } from "@/lib/icons";
import WalletCardShape from "./WalletCardShape";
import type { WalletCard } from "@/types/wallet-card";

const WalletCardModal = dynamic(() => import("./WalletCardModal"), { ssr: false });

export default function WalletCardsView({ initialCards }: { initialCards: WalletCard[] }) {
  const t = useT();
  const [cards, setCards] = useState<WalletCard[]>(initialCards);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; card: WalletCard } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSaved(card: WalletCard) {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    setModal(null);
  }

  async function handleDelete(id: number) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/wallet-cards/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : t("membership.couldNotDelete"));
        return;
      }
      setCards((prev) => prev.filter((c) => c.id !== id));
      setConfirmingId(null);
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">{t("wallet.tabCards")}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{t("wallet.cardsSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "add" })}
          aria-label={t("wallet.addCard")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {cards.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">{t("wallet.cardsEmptyTitle")}</p>
          <p className="text-xs text-ink-soft">{t("wallet.cardsEmptyDesc")}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="group relative">
              <WalletCardShape
                label={card.label}
                holderName={card.holderName}
                last4={card.last4}
                expiryMonth={card.expiryMonth}
                expiryYear={card.expiryYear}
                network={card.network}
                color={card.color}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModal({ mode: "edit", card })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-navy"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(card.id)}
                  aria-label={confirmingId === card.id ? t("common.confirmDelete") : t("common.delete")}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                    confirmingId === card.id
                      ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
                      : "border-line text-ink-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  }`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {confirmingId === card.id && <span>{t("common.confirmDelete")}</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <WalletCardModal
          card={modal.mode === "edit" ? modal.card : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
