"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import { decodePassImage } from "@/lib/decode-pass-image";
import { MembershipCardIcon, ImageIcon } from "@/lib/icons";
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
// MembershipCardModal from the Wallet page's + button. Used to be 4 tiles
// (New pass / Scan / Photo gallery / From file), but on iOS any
// `accept="image/*"` file input opens the exact same system sheet (Take
// Photo, Photo Library, Choose File) no matter which one you tapped —
// Photo gallery, From file, and even the live Scan camera's own "choose a
// photo" fallback all funneled to that identical picker, making three
// separate menu entries read as one confusing duplicate. Down to 2 tiles:
// New pass, and a single "Choose a photo" that decodes whatever image
// comes back (gallery pick, camera-in-the-sheet capture, or a file) via
// the shared decodePassImage helper. Live scanning is still reachable —
// MembershipCardModal's own "Scan instead" button opens ScanCardModal
// directly — just not duplicated here as a third near-identical option.
export default function AddCardEntryModal({
  onClose,
  onNewPass,
  onScanned,
}: {
  onClose: () => void;
  onNewPass: () => void;
  onScanned: (result: ScannedValue) => void;
}) {
  const t = useT();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
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

  return (
    <Modal onClose={onClose} title={t("membership.entryTitle")}>
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} className="hidden" />

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {decoding && <p className="mb-3 text-sm text-ink-soft">{t("membership.decodingPhoto")}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={<MembershipCardIcon className="h-4.5 w-4.5" />} label={t("membership.entryNewPass")} onClick={onNewPass} />
        <Tile
          icon={<ImageIcon className="h-4.5 w-4.5" />}
          label={t("membership.choosePhoto")}
          onClick={() => photoInputRef.current?.click()}
          disabled={decoding}
        />
      </div>
    </Modal>
  );
}
