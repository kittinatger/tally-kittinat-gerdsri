"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
import { isCategoryIconKey } from "@/lib/category-icons";
import { CategoryIcon, EditIcon, TrashIcon, PlusIcon } from "@/lib/icons";
import CategoryModal from "./CategoryModal";

const TYPE_TABS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export default function CategoryManager({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; category: CategoryOption } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type).sort((a, b) => a.id - b.id),
    [categories, type],
  );

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
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not delete that category.");
        setConfirmDeleteId(null);
        return;
      }
      router.refresh();
    } catch (err) {
      setDeleteError(describeFetchError(err));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
    setDeleteError(null);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">Manage categories</h3>
          <p className="mt-0.5 text-sm text-ink-soft">Colors and icons used across the app.</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          aria-label="Add category"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark"
        >
          <PlusIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>

      <div className="mt-4 flex gap-1 rounded-full bg-bg-soft p-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setType(tab.value);
              cancelDelete();
            }}
            className={`flex-1 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              type === tab.value ? "bg-surface text-foreground shadow-sm" : "text-ink-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {deleteError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        {categoriesForType.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-soft">No {type} categories yet.</p>
        ) : (
          categoriesForType.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i === categoriesForType.length - 1 ? "" : "border-b border-line"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badgeClasses(c.color)}`}
              >
                {c.icon && isCategoryIconKey(c.icon) ? (
                  <CategoryIcon iconKey={c.icon} className="h-4.5 w-4.5" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(c.color)}`} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.name}</span>

              {confirmDeleteId === c.id ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={cancelDelete}
                    disabled={deleting}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Confirm delete"}
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setModal({ mode: "edit", category: c })}
                    aria-label={`Edit ${c.name}`}
                    className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  {c.name !== "Other" && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      aria-label={`Delete ${c.name}`}
                      className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modal && (
        <CategoryModal
          type={type}
          category={modal.mode === "edit" ? modal.category : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
