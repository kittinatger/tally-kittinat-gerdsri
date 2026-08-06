"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import Modal from "./Modal";
import { CATEGORY_PALETTE, type TransactionType } from "@/lib/categories";
import { dotClasses } from "@/lib/category-styles";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { CategoryOption } from "@/types/category";

export default function CategoryModal({
  type,
  category,
  onClose,
  onSaved,
}: {
  type: TransactionType;
  category?: CategoryOption;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(category);
  const nameLocked = isEdit && category?.name === "Other";
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_PALETTE[0]);
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = isEdit
        ? await fetch(`/api/categories/${category!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, icon }),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, name, color, icon }),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved();
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit category" : "Add category"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Name
          </label>
          <input
            id="categoryName"
            type="text"
            required
            autoFocus
            disabled={nameLocked}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-card border border-line bg-bg-soft px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-60"
          />
          {nameLocked && (
            <p className="mt-1.5 text-xs text-ink-soft">
              &quot;Other&quot; can&apos;t be renamed — it&apos;s used as the fallback category.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Color</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-8 w-8 rounded-full transition ${dotClasses(c)} ${
                  color === c ? "ring-2 ring-navy ring-offset-2 ring-offset-surface" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Icon (optional)</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setIcon(null)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                icon === null ? "border-navy bg-navy/10 text-navy dark:text-blue-300" : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
              }`}
            >
              None
            </button>
            {CATEGORY_ICONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                aria-label={e}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition ${
                  icon === e ? "border-navy bg-navy/10" : "border-line hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
