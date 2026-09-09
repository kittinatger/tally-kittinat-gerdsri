"use client";

import { useState } from "react";
import Modal from "./Modal";
import ColorPicker from "./ColorPicker";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import { CATEGORY_PALETTE } from "@/lib/categories";
import type { CardFolder } from "@/types/card-folder";

// Creates a new folder (no `folder` prop) or renames/recolors an existing
// one — same name+color fields either way, so one form covers both,
// matching CategoryModal's create/edit-in-one-component convention.
export default function FolderFormModal({
  kind,
  folder,
  onClose,
  onSaved,
}: {
  kind: "wallet" | "pass";
  folder?: CardFolder;
  onClose: () => void;
  onSaved: (folder: CardFolder) => void;
}) {
  const t = useT();
  const isEdit = Boolean(folder);
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState<string>(folder?.color ?? CATEGORY_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = isEdit
        ? await fetch(`/api/folders/${folder!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color }),
          })
        : await fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind, name, color }),
          });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("folder.couldNotSave"));
        return;
      }
      onSaved(data.folder as CardFolder);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t("folder.editTitle") : t("folder.newFolder")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="folderName" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            {t("folder.nameLabel")}
          </label>
          <input
            id="folderName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">{t("folder.colorLabel")}</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark active:scale-[0.97] disabled:opacity-60"
          >
            {t("common.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
