"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dotClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import type { WalletOption } from "@/types/wallet";
import WalletModal from "./WalletModal";
import WalletTransferModal from "./WalletTransferModal";

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </svg>
  );
}

export default function WalletManager({ wallets }: { wallets: WalletOption[] }) {
  const router = useRouter();
  const currency = useCurrency();
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; wallet: WalletOption } | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeWallets = wallets.filter((w) => !w.archived);
  const archivedWallets = wallets.filter((w) => w.archived);

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  function handleTransferSaved() {
    setTransferOpen(false);
    router.refresh();
  }

  async function patchWallet(id: number, body: Record<string, unknown>) {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/wallets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not update that wallet.");
        return;
      }
      router.refresh();
    } catch {
      setActionError("Network error while updating.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setActionError(null);
      return;
    }
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not delete that wallet.");
        setConfirmDeleteId(null);
        return;
      }
      router.refresh();
    } catch {
      setActionError("Network error while deleting.");
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function renderWallet(w: WalletOption, isLast: boolean) {
    return (
      <div
        key={w.id}
        className={`flex items-center justify-between gap-3 px-4 py-3 ${isLast ? "" : "border-b border-line"} ${
          w.archived ? "opacity-60" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses(w.color)}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium text-foreground">{w.name}</p>
              {w.isDefault && (
                <span className="shrink-0 rounded-full bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy dark:text-blue-300">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft">
              {w.kind === "digital" ? "Digital" : "Cash"} · {formatCurrency(w.balance, w.currency ?? currency)}
              {w.currency ? ` (${w.currency})` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!w.archived && !w.isDefault && (
            <button
              onClick={() => patchWallet(w.id, { isDefault: true })}
              disabled={busyId === w.id}
              className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
            >
              Make default
            </button>
          )}
          <button
            onClick={() => setModal({ mode: "edit", wallet: w })}
            aria-label={`Edit ${w.name}`}
            className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
            </svg>
          </button>
          <button
            onClick={() => patchWallet(w.id, { archived: !w.archived })}
            disabled={busyId === w.id}
            aria-label={w.archived ? `Unarchive ${w.name}` : `Archive ${w.name}`}
            className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
          >
            <ArchiveIcon />
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
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-foreground">Wallets</h3>
        <div className="flex items-center gap-2">
          {activeWallets.length > 1 && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-navy"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                <path d="M7 7h13l-3.5-3.5M17 17H4l3.5 3.5" />
              </svg>
              Transfer
            </button>
          )}
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
      </div>

      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        Each transaction can be assigned to a wallet; the default wallet is used when none is chosen. Archiving hides
        a wallet from pickers and totals without deleting its history.
      </p>

      {actionError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        {activeWallets.map((w, i) => renderWallet(w, i === activeWallets.length - 1))}
      </div>

      {archivedWallets.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Archived</p>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {archivedWallets.map((w, i) => renderWallet(w, i === archivedWallets.length - 1))}
          </div>
        </div>
      )}

      {modal && (
        <WalletModal
          wallet={modal.mode === "edit" ? modal.wallet : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {transferOpen && (
        <WalletTransferModal wallets={activeWallets} onClose={() => setTransferOpen(false)} onSaved={handleTransferSaved} />
      )}
    </div>
  );
}
