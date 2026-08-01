"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import type { WalletOption } from "@/types/wallet";
import WalletModal from "./WalletModal";

export default function WalletManager({ wallets }: { wallets: WalletOption[] }) {
  const router = useRouter();
  const currency = useCurrency();
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; wallet: WalletOption } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setDeleteError(null);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not delete that wallet.");
        setConfirmDeleteId(null);
        return;
      }
      router.refresh();
    } catch {
      setDeleteError("Network error while deleting.");
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Wallets</h3>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark"
        >
          <svg viewBox="0 0 20.918 20.5762" fill="currentColor" className="h-3 w-3 shrink-0">
            <path d="M11.2305 19.5996L11.2305 0.957031C11.2305 0.439453 10.8008 0 10.2734 0C9.75586 0 9.32617 0.439453 9.32617 0.957031L9.32617 19.5996C9.32617 20.1172 9.75586 20.5566 10.2734 20.5566C10.8008 20.5566 11.2305 20.1172 11.2305 19.5996ZM0.957031 11.2305L19.5996 11.2305C20.1172 11.2305 20.5566 10.8008 20.5566 10.2832C20.5566 9.75586 20.1172 9.32617 19.5996 9.32617L0.957031 9.32617C0.439453 9.32617 0 9.75586 0 10.2832C0 10.8008 0.439453 11.2305 0.957031 11.2305Z" />
          </svg>
          Add wallet
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        Each transaction can be assigned to a wallet; the balance below reflects only that wallet&apos;s transactions.
      </p>

      {deleteError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        {wallets.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i === wallets.length - 1 ? "" : "border-b border-line"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses(w.color)}`} />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{w.name}</p>
                <p className="text-xs text-ink-soft">
                  {w.kind === "digital" ? "Digital" : "Cash"} · {formatCurrency(w.balance, currency)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setModal({ mode: "edit", wallet: w })}
                aria-label={`Edit ${w.name}`}
                className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
                </svg>
              </button>
              {wallets.length > 1 && (
                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={deleting}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                    confirmDeleteId === w.id
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  }`}
                >
                  {confirmDeleteId === w.id ? "Confirm" : "Delete"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <WalletModal
          wallet={modal.mode === "edit" ? modal.wallet : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
