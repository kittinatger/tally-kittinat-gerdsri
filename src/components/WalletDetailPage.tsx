"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveIcon, CaretLeftIcon, CopySimpleIcon, FolderSimpleIcon, PencilSimpleIcon, PlusIcon, UsersIcon } from "@phosphor-icons/react/dist/ssr";
import type { WalletOption } from "@/types/wallet";
import type { CardFolder } from "@/types/card-folder";
import { CurrencyProvider } from "@/lib/currency-context";
import { describeFetchError } from "@/lib/fetch-error";
import { duplicateWallet } from "@/lib/wallet-duplicate";
import { useT } from "@/lib/language-context";
import AccountDetail from "./AccountDetail";
import AppHeader from "./AppHeader";
import SelectDropdown from "./SelectDropdown";

const WalletShareModal = dynamic(() => import("./WalletShareModal"), { ssr: false });

const chip =
  "flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-navy";

const NO_FOLDER = "No folder";

// A card / account on its own page (/wallet/[id]) instead of a popup: the
// card (tap to flip it), quick actions, then balance, details and recent
// transactions.
export default function WalletDetailPage({
  wallet,
  folders,
  defaultSignature,
  currency,
}: {
  wallet: WalletOption;
  folders: CardFolder[];
  defaultSignature: string | null;
  currency: string;
}) {
  const t = useT();
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState(wallet.folderId);
  const [folderError, setFolderError] = useState<string | null>(null);
  const folder = folders.find((f) => f.id === folderId) ?? null;

  async function patch(body: object) {
    const res = await fetch(`/api/wallets/${wallet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, error: typeof data?.error === "string" ? (data.error as string) : null };
  }

  async function archive() {
    setArchiveError(null);
    try {
      const r = await patch({ archived: true });
      if (!r.ok) return setArchiveError(r.error ?? "Could not archive that wallet.");
      router.push("/wallet");
      router.refresh();
    } catch (err) {
      setArchiveError(describeFetchError(err));
    }
  }

  // Makes a copy (same look, details, signature, back and folder; balance
  // starts at zero) and opens it.
  async function duplicate() {
    setDuplicating(true);
    setDuplicateError(null);
    try {
      const id = await duplicateWallet(wallet);
      router.push(`/wallet/${id}`);
      router.refresh();
    } catch (err) {
      setDuplicateError(err instanceof Error ? err.message : describeFetchError(err));
      setDuplicating(false);
    }
  }

  async function moveToFolder(name: string) {
    const next = folders.find((f) => f.name === name)?.id ?? null;
    const before = folderId;
    setFolderError(null);
    setFolderId(next);
    try {
      const r = await patch({ folderId: next });
      if (!r.ok) throw new Error();
    } catch {
      setFolderId(before);
      setFolderError(t("folder.couldNotSave"));
    }
  }

  return (
    <CurrencyProvider currency={currency}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
        <AppHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-1 py-4 sm:px-2 sm:py-6">
          <Link href="/wallet" className="mb-3 flex w-fit items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-ink-soft transition hover:text-foreground">
            <CaretLeftIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
            {t("nav.wallet")}
          </Link>
          <div className="mb-4 min-w-0">
            <h1 className="truncate font-display text-2xl text-foreground">{wallet.name}</h1>
            {folder && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                <FolderSimpleIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
                {folder.name}
              </p>
            )}
          </div>

          <AccountDetail
            wallet={wallet}
            defaultSignature={defaultSignature}
            archiveError={archiveError ?? duplicateError}
            confirmArchive={confirmArchive}
            onCancelArchive={() => setConfirmArchive(false)}
            onArchive={archive}
            actions={
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <Link href={`/transactions/new?type=income&wallet=${wallet.id}&from=/wallet/${wallet.id}`} className={chip}>
                  <PlusIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                  {t("wallet.addMoney")}
                </Link>
                {wallet.isOwner && (
                  <>
                    <Link href={`/wallet/${wallet.id}/edit`} className={chip}>
                      <PencilSimpleIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                      {t("common.edit")}
                    </Link>
                    <button type="button" onClick={duplicate} disabled={duplicating} className={`${chip} disabled:opacity-60`}>
                      <CopySimpleIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                      {duplicating ? "Duplicating…" : "Duplicate"}
                    </button>
                    <button type="button" onClick={() => setSharing(true)} className={chip}>
                      <UsersIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                      {t("wallet.shareWallet")}
                    </button>
                    <button type="button" onClick={() => setConfirmArchive(true)} className={chip}>
                      <ArchiveIcon weight="bold" aria-hidden="true" className="h-4 w-4" />
                      {t("wallet.archive")}
                    </button>
                  </>
                )}
              </div>
            }
            folderControl={
              wallet.isOwner && folders.length > 0 ? (
                <div className="mt-4 rounded-card border border-line bg-surface p-3.5">
                  <label className="mb-1.5 block text-xs uppercase tracking-wide text-ink-soft">Folder</label>
                  <SelectDropdown value={folder?.name ?? NO_FOLDER} options={[NO_FOLDER, ...folders.map((f) => f.name)]} onChange={moveToFolder} />
                  {folderError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{folderError}</p>}
                </div>
              ) : null
            }
          />

          {sharing && <WalletShareModal walletId={wallet.id} walletName={wallet.name} onClose={() => setSharing(false)} />}
        </main>
      </div>
    </CurrencyProvider>
  );
}
