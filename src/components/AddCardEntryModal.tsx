"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import { decodePassImage } from "@/lib/decode-pass-image";
import { MembershipCardIcon, CameraIcon, ImageIcon, FileIcon } from "@/lib/icons";
import { useT } from "@/lib/language-context";
import type { MembershipCodeFormat } from "@/lib/memberships";

type ScannedValue = { value: string; format: MembershipCodeFormat };

function Tile({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-5 text-center transition hover:border-navy disabled:opacity-60"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
        {icon}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </button>
  );
}

// The "Create pass" entry menu — replaces jumping straight into
// MembershipCardModal from MembershipsView's + button. New pass opens the
// blank form; Scan opens ScanCardModal's live camera path directly; Photo
// gallery and From file both decode a still image via the shared
// decodePassImage helper (From file has no `accept` restriction, so
// non-image files are possible — those get a clear inline message instead
// of silently failing, since there's no .pkpass parser here).
export default function AddCardEntryModal({
  onClose,
  onNewPass,
  onScanRequested,
  onScanned,
}: {
  onClose: () => void;
  onNewPass: () => void;
  onScanRequested: () => void;
  onScanned: (result: ScannedValue) => void;
}) {
  const t = useT();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageFile(file: File) {
    setError(null);
    setDecoding(true);
    const result = await decodePassImage(file);
    setDecoding(false);
    if (result) {
      onScanned(result);
    } else {
      setError(t("membership.scanPhotoError"));
    }
  }

  async function handleGallerySelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await handleImageFile(file);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("membership.fileImportUnsupported"));
      return;
    }
    await handleImageFile(file);
  }

  return (
    <Modal onClose={onClose} title={t("membership.entryTitle")}>
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGallerySelected} className="hidden" />
      <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {decoding && <p className="mb-3 text-sm text-ink-soft">{t("membership.decodingPhoto")}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={<MembershipCardIcon className="h-4.5 w-4.5" />} label={t("membership.entryNewPass")} onClick={onNewPass} />
        <Tile icon={<CameraIcon className="h-4.5 w-4.5" />} label={t("membership.entryScan")} onClick={onScanRequested} />
        <Tile
          icon={<ImageIcon className="h-4.5 w-4.5" />}
          label={t("membership.entryPhotoGallery")}
          onClick={() => galleryInputRef.current?.click()}
          disabled={decoding}
        />
        <Tile
          icon={<FileIcon className="h-4.5 w-4.5" />}
          label={t("membership.entryFromFile")}
          onClick={() => fileInputRef.current?.click()}
          disabled={decoding}
        />
      </div>
    </Modal>
  );
}
