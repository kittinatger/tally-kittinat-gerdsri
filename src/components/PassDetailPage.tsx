"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeftIcon, FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { MembershipCard } from "@/types/membership";
import type { CardFolder } from "@/types/card-folder";
import { EditIcon, TrashIcon } from "@/lib/icons";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import { membershipImageUrl } from "@/lib/membership-card-mapper";
import PassShape from "./PassShape";
import AppHeader from "./AppHeader";
import SelectDropdown from "./SelectDropdown";

const MembershipCardModal = dynamic(() => import("./MembershipCardModal"), { ssr: false });
const ScanCardModal = dynamic(() => import("./ScanCardModal"), { ssr: false });

const NO_FOLDER = "No folder";

// A pass/membership card on its own page (/pass/[id]) instead of a popup —
// same idea as WalletDetailPage for accounts and payment cards.
export default function PassDetailPage({ card: initialCard, folders }: { card: MembershipCard; folders: CardFolder[] }) {
  const t = useT();
  const router = useRouter();
  const [card, setCard] = useState(initialCard);
  const [editing, setEditing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pendingScan, setPendingScan] = useState<{ value: string; format: import("@/lib/memberships").MembershipCodeFormat } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState(card.folderId);
  const folder = folders.find((f) => f.id === folderId) ?? null;

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/memberships/${card.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : t("membership.couldNotDelete"));
        return;
      }
      router.push("/wallet");
      router.refresh();
    } catch (err) {
      setError(describeFetchError(err));
    }
  }

  async function moveToFolder(name: string) {
    const next = folders.find((f) => f.name === name)?.id ?? null;
    const before = folderId;
    setError(null);
    setFolderId(next);
    try {
      const res = await fetch(`/api/memberships/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFolderId(before);
      setError(t("folder.couldNotSave"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-28 pt-3 sm:px-4 sm:pb-10">
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-1 py-4 sm:px-2 sm:py-6">
        <Link href="/wallet" className="mb-3 flex w-fit items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-ink-soft transition hover:text-foreground">
          <CaretLeftIcon weight="fill" aria-hidden="true" className="h-4 w-4" />
          {t("nav.wallet")}
        </Link>
        <div className="mb-4 min-w-0">
          <h1 className="truncate font-display text-2xl text-foreground">{card.name}</h1>
          {folder && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
              <FolderSimpleIcon weight="fill" aria-hidden="true" className="h-3.5 w-3.5" />
              {folder.name}
            </p>
          )}
        </div>

        <PassShape
          name={card.name}
          color={card.color}
          background={card.background}
          textColor={card.textColor}
          icon={card.icon}
          kind={card.kind}
          fields={card.fields}
          layout={card.layout}
          codeValue={card.codeValue}
          codeFormat={card.codeFormat}
          codeSize="large"
          logoUrl={card.hasLogo ? membershipImageUrl(card.id, "logo", card.logoUpdatedAt) : null}
          bannerUrl={card.hasBanner ? membershipImageUrl(card.id, "banner", card.bannerUpdatedAt) : null}
          notes={card.notes}
          customFieldLabels={card.customFieldLabels}
          showLogo={card.showLogo}
          showName={card.showName}
          hiddenFieldLabels={card.hiddenFieldLabels}
          showCodeText={card.showCodeText}
        />

        {card.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-card border border-line bg-surface p-3.5 text-sm text-ink-soft">{card.notes}</p>
        )}

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPendingScan(null);
              setEditing(true);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-navy"
          >
            <EditIcon className="h-4 w-4" />
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={confirming ? t("common.confirmDelete") : t("common.delete")}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${
              confirming
                ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
                : "border-line text-ink-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            }`}
          >
            <TrashIcon />
            {confirming && <span>{t("common.confirmDelete")}</span>}
          </button>
        </div>

        {folders.length > 0 && (
          <div className="mt-4 rounded-card border border-line bg-surface p-3.5">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-ink-soft">Folder</label>
            <SelectDropdown value={folder?.name ?? NO_FOLDER} options={[NO_FOLDER, ...folders.map((f) => f.name)]} onChange={moveToFolder} />
          </div>
        )}
      </main>

      {editing && (
        <MembershipCardModal
          card={card}
          scannedValue={pendingScan}
          onClose={() => {
            setEditing(false);
            setPendingScan(null);
          }}
          onSaved={(saved) => {
            setCard(saved);
            setFolderId(saved.folderId);
            setEditing(false);
            setPendingScan(null);
            router.refresh();
          }}
          onScanRequested={() => setScanning(true)}
        />
      )}

      {scanning && (
        <ScanCardModal
          onClose={() => setScanning(false)}
          onScanned={(result) => {
            setScanning(false);
            setPendingScan(result);
          }}
        />
      )}
    </div>
  );
}
