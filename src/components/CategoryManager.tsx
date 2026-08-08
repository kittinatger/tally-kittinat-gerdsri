"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { badgeClasses, dotClasses } from "@/lib/category-styles";
import type { TransactionType } from "@/lib/categories";
import type { CategoryOption } from "@/types/category";
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
          <svg viewBox="0 0 20.918 20.5762" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path d="M11.2305 19.5996L11.2305 0.957031C11.2305 0.439453 10.8008 0 10.2734 0C9.75586 0 9.32617 0.439453 9.32617 0.957031L9.32617 19.5996C9.32617 20.1172 9.75586 20.5566 10.2734 20.5566C10.8008 20.5566 11.2305 20.1172 11.2305 19.5996ZM0.957031 11.2305L19.5996 11.2305C20.1172 11.2305 20.5566 10.8008 20.5566 10.2832C20.5566 9.75586 20.1172 9.32617 19.5996 9.32617L0.957031 9.32617C0.439453 9.32617 0 9.75586 0 10.2832C0 10.8008 0.439453 11.2305 0.957031 11.2305Z" />
          </svg>
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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${badgeClasses(c.color)}`}
              >
                {c.icon ?? <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(c.color)}`} />}
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
                    </svg>
                  </button>
                  {c.name !== "Other" && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      aria-label={`Delete ${c.name}`}
                      className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <svg viewBox="0 0 25.6738 31.2305" fill="currentColor" className="h-4 w-4">
                        <path d="M8.76953 24.8389C8.19824 24.8389 7.8125 24.4727 7.7832 23.9014L7.39258 10.3271C7.37305 9.74609 7.75391 9.37988 8.34961 9.37988C8.9209 9.37988 9.31641 9.74121 9.33594 10.3174L9.74121 23.8867C9.76074 24.458 9.375 24.8389 8.76953 24.8389ZM12.6611 24.8389C12.0752 24.8389 11.6797 24.4678 11.6797 23.9014L11.6797 10.3125C11.6797 9.74609 12.0752 9.37988 12.6611 9.37988C13.2422 9.37988 13.6377 9.74609 13.6377 10.3125L13.6377 23.9014C13.6377 24.4678 13.2422 24.8389 12.6611 24.8389ZM16.543 24.8389C15.9375 24.8389 15.5566 24.458 15.5762 23.8916L15.9766 10.3223C15.9961 9.74609 16.3916 9.37988 16.9678 9.37988C17.5635 9.37988 17.9395 9.75098 17.9248 10.332L17.5293 23.9014C17.5 24.4775 17.1143 24.8389 16.543 24.8389ZM6.73828 5.78125L9.34082 5.78125L9.34082 3.2666C9.34082 2.6709 9.75586 2.29004 10.4199 2.29004L14.8779 2.29004C15.542 2.29004 15.957 2.6709 15.957 3.2666L15.957 5.78125L18.5596 5.78125L18.5596 3.17383C18.5596 1.15723 17.2949 0 15.0635 0L10.2344 0C8.00781 0 6.73828 1.15723 6.73828 3.17383ZM1.26953 7.53418L24.043 7.53418C24.7656 7.53418 25.3125 7.00195 25.3125 6.28418C25.3125 5.57129 24.7656 5.04395 24.043 5.04395L1.26953 5.04395C0.556641 5.04395 0 5.57617 0 6.28418C0 7.00684 0.556641 7.53418 1.26953 7.53418ZM6.87012 28.8232L18.457 28.8232C20.4883 28.8232 21.7822 27.6416 21.8799 25.6006L22.7441 7.27539L2.57324 7.27539L3.4375 25.6055C3.53516 27.6514 4.81445 28.8232 6.87012 28.8232Z" />
                      </svg>
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
