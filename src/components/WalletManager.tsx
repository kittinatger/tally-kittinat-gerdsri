"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { badgeClasses, colorDotStyle } from "@/lib/category-styles";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import type { WalletOption } from "@/types/wallet";
import { EditIcon, TrashIcon, PlusIcon } from "@/lib/icons";
import WalletModal from "./WalletModal";
import WalletTransferModal from "./WalletTransferModal";
import WalletShareModal from "./WalletShareModal";
import FilterDropdown from "./FilterDropdown";
import { useT } from "@/lib/language-context";
import { mutateFetch } from "@/lib/offline/fetch-wrapper";

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="15" cy="5" r="2.25" />
      <circle cx="5" cy="10" r="2.25" />
      <circle cx="15" cy="15" r="2.25" />
      <path d="M7 8.9l6-2.8M7 11.1l6 2.8" />
    </svg>
  );
}

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


export default function WalletManager({
  wallets,
  initialActivitiesDefaultWalletId,
}: {
  wallets: WalletOption[];
  initialActivitiesDefaultWalletId: number | null;
}) {
  const router = useRouter();
  const t = useT();
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
  const [sharingWallet, setSharingWallet] = useState<WalletOption | null>(null);
  const [pendingInvites, setPendingInvites] = useState<{ id: number; wallet_id: number; wallet_name: string; owner_username: string }[]>([]);
  const [invitesBusyId, setInvitesBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/wallet-members/pending")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.invites)) setPendingInvites(data.invites);
      })
      .catch(() => {});
  }, []);

  async function respondToInvite(id: number, accept: boolean) {
    setInvitesBusyId(id);
    try {
      await mutateFetch(`/api/wallet-members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      setPendingInvites((prev) => prev.filter((i) => i.id !== id));
      if (accept) router.refresh();
    } finally {
      setInvitesBusyId(null);
    }
  }

  async function handleLeaveShared(walletId: number) {
    setBusyId(walletId);
    try {
      await mutateFetch(`/api/wallets/${walletId}/members/me`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const activeWallets = wallets.filter((w) => !w.archived);
  const archivedWallets = wallets.filter((w) => w.archived);

  async function handleActivitiesDefaultChange(name: string) {
    const walletId = name === "all" ? null : (activeWallets.find((w) => w.name === name)?.id ?? null);
    const previous = activitiesDefaultWalletId;
    setActivitiesDefaultWalletId(walletId);
    setSavingActivitiesDefault(true);
    setActivitiesDefaultError(null);
    try {
      const res = await mutateFetch("/api/wallets/activities-default", {
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
      const res = await mutateFetch(`/api/wallets/${id}`, {
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
      const res = await mutateFetch(`/api/wallets/${id}`, {
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
      const res = await mutateFetch(`/api/wallets/${id}`, { method: "DELETE" });
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
        className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 ${isLast ? "" : "border-b border-line"} ${
          w.archived ? "opacity-60" : ""
        }`}
      >
        {/* Below sm: the reorder/icon/name/balance block gets its own full-width
         * row, with actions (Make default, edit, archive, delete) on a second
         * row below instead of squeezed into the same row — at phone widths
         * that squeeze left the name truncated to 1-2 characters and forced
         * the balance line to wrap awkwardly. At sm+ both blocks sit in one
         * row as before (this div only gets sm:flex-1 there). */}
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <div className={`flex shrink-0 flex-col ${w.isOwner ? "" : "invisible"}`}>
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

          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(w.color)}`}
            style={colorDotStyle(w.color)}
          >
            <WalletGlyphIcon />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium text-foreground">{w.name}</p>
              {w.isDefault && (
                <span className="shrink-0 rounded-full bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy dark:text-blue-300">
                  {t("wallet.default")}
                </span>
              )}
              {!w.isOwner && (
                <span className="shrink-0 rounded-full bg-bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                  {t("wallet.sharedWithYou")}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft">
              {w.kind === "digital" ? t("wallet.digital") : t("wallet.cash")} · {formatCurrency(w.balance, w.currency ?? currency)}
              {w.currency ? ` (${w.currency})` : ""}
            </p>
          </div>
        </div>

        {confirming ? (
          <div className="flex shrink-0 items-center justify-end gap-1.5">
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => handleDelete(w.id)}
              disabled={deleting}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? t("common.deleting") : t("common.confirmDelete")}
            </button>
          </div>
        ) : w.isOwner ? (
          <div className="flex shrink-0 items-center justify-end gap-1">
            {!w.archived && !w.isDefault && (
              <button
                onClick={() => patchWallet(w.id, { isDefault: true })}
                disabled={busyId === w.id}
                className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
              >
                {t("wallet.makeDefault")}
              </button>
            )}
            {!w.archived && (
              <button
                onClick={() => setSharingWallet(w)}
                aria-label={t("wallet.shareWallet")}
                className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                <ShareIcon />
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
        ) : (
          <div className="flex shrink-0 items-center justify-end gap-1">
            <button
              onClick={() => handleLeaveShared(w.id)}
              disabled={busyId === w.id}
              className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              {t("wallet.leaveShared")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">{t("wallet.wallets")}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {t("wallet.walletsDesc")}
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
              {t("common.transfer")}
            </button>
          )}
          <button
            onClick={() => setModal({ mode: "add" })}
            aria-label={t("wallet.addWallet")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
          >
            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      {pendingInvites.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
          {pendingInvites.map((inv, i) => (
            <div key={inv.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t border-line"}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{inv.wallet_name}</p>
                <p className="text-xs text-ink-soft">
                  {t("wallet.invitedBy")} {inv.owner_username}
                </p>
              </div>
              <button
                onClick={() => respondToInvite(inv.id, false)}
                disabled={invitesBusyId === inv.id}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => respondToInvite(inv.id, true)}
                disabled={invitesBusyId === inv.id}
                className="shrink-0 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
              >
                {t("wallet.accept")}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeWallets.length > 1 && (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">{t("wallet.defaultForActivities")}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {t("wallet.defaultForActivitiesDesc")}
          </p>
          <div className="mt-2.5">
            <FilterDropdown
              value={activeWallets.find((w) => w.id === activitiesDefaultWalletId)?.name ?? "all"}
              allLabel={t("activities.allWallets")}
              options={activeWallets.map((w) => w.name)}
              onChange={handleActivitiesDefaultChange}
            />
          </div>
          {savingActivitiesDefault && <p className="mt-1.5 text-xs text-ink-soft">{t("common.saving")}</p>}
          {activitiesDefaultError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{activitiesDefaultError}</p>}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        {activeWallets.map((w, i) => renderWallet(w, i, activeWallets.length))}
      </div>

      {archivedWallets.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("wallet.archived")}</p>
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

      {sharingWallet && (
        <WalletShareModal walletId={sharingWallet.id} walletName={sharingWallet.name} onClose={() => setSharingWallet(null)} />
      )}
    </div>
  );
}
