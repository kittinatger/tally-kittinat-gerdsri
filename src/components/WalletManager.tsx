"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { badgeClasses } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import type { WalletOption } from "@/types/wallet";
import WalletModal from "./WalletModal";
import WalletTransferModal from "./WalletTransferModal";
import FilterDropdown from "./FilterDropdown";

function WalletGlyphIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v8A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5Z" />
      <path d="M3 8.5h13.5A1.5 1.5 0 0 1 18 10v4a1.5 1.5 0 0 1-1.5 1.5" />
      <circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 25.6738 31.2305" fill="currentColor" className="h-4 w-4">
      <path d="M8.76953 24.8389C8.19824 24.8389 7.8125 24.4727 7.7832 23.9014L7.39258 10.3271C7.37305 9.74609 7.75391 9.37988 8.34961 9.37988C8.9209 9.37988 9.31641 9.74121 9.33594 10.3174L9.74121 23.8867C9.76074 24.458 9.375 24.8389 8.76953 24.8389ZM12.6611 24.8389C12.0752 24.8389 11.6797 24.4678 11.6797 23.9014L11.6797 10.3125C11.6797 9.74609 12.0752 9.37988 12.6611 9.37988C13.2422 9.37988 13.6377 9.74609 13.6377 10.3125L13.6377 23.9014C13.6377 24.4678 13.2422 24.8389 12.6611 24.8389ZM16.543 24.8389C15.9375 24.8389 15.5566 24.458 15.5762 23.8916L15.9766 10.3223C15.9961 9.74609 16.3916 9.37988 16.9678 9.37988C17.5635 9.37988 17.9395 9.75098 17.9248 10.332L17.5293 23.9014C17.5 24.4775 17.1143 24.8389 16.543 24.8389ZM6.73828 5.78125L9.34082 5.78125L9.34082 3.2666C9.34082 2.6709 9.75586 2.29004 10.4199 2.29004L14.8779 2.29004C15.542 2.29004 15.957 2.6709 15.957 3.2666L15.957 5.78125L18.5596 5.78125L18.5596 3.17383C18.5596 1.15723 17.2949 0 15.0635 0L10.2344 0C8.00781 0 6.73828 1.15723 6.73828 3.17383ZM1.26953 7.53418L24.043 7.53418C24.7656 7.53418 25.3125 7.00195 25.3125 6.28418C25.3125 5.57129 24.7656 5.04395 24.043 5.04395L1.26953 5.04395C0.556641 5.04395 0 5.57617 0 6.28418C0 7.00684 0.556641 7.53418 1.26953 7.53418ZM6.87012 28.8232L18.457 28.8232C20.4883 28.8232 21.7822 27.6416 21.8799 25.6006L22.7441 7.27539L2.57324 7.27539L3.4375 25.6055C3.53516 27.6514 4.81445 28.8232 6.87012 28.8232Z" />
    </svg>
  );
}

export default function WalletManager({
  wallets,
  initialActivitiesDefaultWalletId,
}: {
  wallets: WalletOption[];
  initialActivitiesDefaultWalletId: number | null;
}) {
  const router = useRouter();
  const currency = useCurrency();
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; wallet: WalletOption } | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activitiesDefaultWalletId, setActivitiesDefaultWalletId] = useState(initialActivitiesDefaultWalletId);
  const [savingActivitiesDefault, setSavingActivitiesDefault] = useState(false);
  const [activitiesDefaultError, setActivitiesDefaultError] = useState<string | null>(null);

  const activeWallets = wallets.filter((w) => !w.archived);
  const archivedWallets = wallets.filter((w) => w.archived);

  async function handleActivitiesDefaultChange(name: string) {
    const walletId = name === "all" ? null : (activeWallets.find((w) => w.name === name)?.id ?? null);
    const previous = activitiesDefaultWalletId;
    setActivitiesDefaultWalletId(walletId);
    setSavingActivitiesDefault(true);
    setActivitiesDefaultError(null);
    try {
      const res = await fetch("/api/wallets/activities-default", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActivitiesDefaultError(typeof data?.error === "string" ? data.error : "Could not save that setting.");
        setActivitiesDefaultWalletId(previous);
        return;
      }
    } catch (err) {
      setActivitiesDefaultError(describeFetchError(err));
      setActivitiesDefaultWalletId(previous);
    } finally {
      setSavingActivitiesDefault(false);
    }
  }

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
    } catch (err) {
      setActionError(describeFetchError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/wallets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move: direction }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(typeof data?.error === "string" ? data.error : "Could not reorder that wallet.");
        return;
      }
      router.refresh();
    } catch (err) {
      setActionError(describeFetchError(err));
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
    } catch (err) {
      setActionError(describeFetchError(err));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function renderWallet(w: WalletOption, indexInGroup: number, groupLength: number) {
    const isLast = indexInGroup === groupLength - 1;
    const confirming = confirmDeleteId === w.id;
    return (
      <div
        key={w.id}
        className={`flex items-center gap-3 px-4 py-3 ${isLast ? "" : "border-b border-line"} ${
          w.archived ? "opacity-60" : ""
        }`}
      >
        <div className="flex shrink-0 flex-col">
          <button
            onClick={() => handleMove(w.id, "up")}
            disabled={busyId === w.id || indexInGroup === 0}
            aria-label={`Move ${w.name} up`}
            className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M5 12l5-5 5 5" />
            </svg>
          </button>
          <button
            onClick={() => handleMove(w.id, "down")}
            disabled={busyId === w.id || indexInGroup === groupLength - 1}
            aria-label={`Move ${w.name} down`}
            className="rounded p-0.5 text-ink-soft transition hover:text-foreground disabled:opacity-30"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M5 8l5 5 5-5" />
            </svg>
          </button>
        </div>

        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(w.color)}`}>
          <WalletGlyphIcon />
        </span>

        <div className="min-w-0 flex-1">
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

        {confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(w.id)}
              disabled={deleting}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </button>
          </div>
        ) : (
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
              <EditIcon />
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
                aria-label={`Delete ${w.name}`}
                className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">Wallets</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            Each transaction can be assigned to a wallet; the default is used when none is chosen. Archiving hides a
            wallet from pickers and totals without deleting its history.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeWallets.length > 1 && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-navy"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                <path d="M7 7h13l-3.5-3.5M17 17H4l3.5 3.5" />
              </svg>
              Transfer
            </button>
          )}
          <button
            onClick={() => setModal({ mode: "add" })}
            aria-label="Add wallet"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
          >
            <svg viewBox="0 0 20.918 20.5762" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
              <path d="M11.2305 19.5996L11.2305 0.957031C11.2305 0.439453 10.8008 0 10.2734 0C9.75586 0 9.32617 0.439453 9.32617 0.957031L9.32617 19.5996C9.32617 20.1172 9.75586 20.5566 10.2734 20.5566C10.8008 20.5566 11.2305 20.1172 11.2305 19.5996ZM0.957031 11.2305L19.5996 11.2305C20.1172 11.2305 20.5566 10.8008 20.5566 10.2832C20.5566 9.75586 20.1172 9.32617 19.5996 9.32617L0.957031 9.32617C0.439453 9.32617 0 9.75586 0 10.2832C0 10.8008 0.439453 11.2305 0.957031 11.2305Z" />
            </svg>
          </button>
        </div>
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      {activeWallets.length > 1 && (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">Default wallet for Activities</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Which wallet the Activities page&apos;s balance card is scoped to when it opens.
          </p>
          <div className="mt-2.5">
            <FilterDropdown
              value={activeWallets.find((w) => w.id === activitiesDefaultWalletId)?.name ?? "all"}
              allLabel="All wallets"
              options={activeWallets.map((w) => w.name)}
              onChange={handleActivitiesDefaultChange}
            />
          </div>
          {savingActivitiesDefault && <p className="mt-1.5 text-xs text-ink-soft">Saving...</p>}
          {activitiesDefaultError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{activitiesDefaultError}</p>}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        {activeWallets.map((w, i) => renderWallet(w, i, activeWallets.length))}
      </div>

      {archivedWallets.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Archived</p>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {archivedWallets.map((w, i) => renderWallet(w, i, archivedWallets.length))}
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
