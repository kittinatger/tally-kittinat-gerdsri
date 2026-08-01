"use client";

import { useEffect, useState } from "react";

type TagCount = { name: string; count: number };

export default function TagManager() {
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTags(Array.isArray(data.tags) ? data.tags : []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load tags.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit(tag: TagCount) {
    setEditing(tag.name);
    setDraft(tag.name);
    setConfirmDelete(null);
    setActionError(null);
  }

  async function saveRename(oldName: string) {
    const newName = draft.trim();
    if (!newName || newName === oldName) {
      setEditing(null);
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not rename that tag.");
        return;
      }
      setTags((prev) => {
        if (!prev) return prev;
        const merged = new Map<string, number>();
        for (const t of prev) {
          const key = t.name === oldName ? newName : t.name;
          merged.set(key, (merged.get(key) ?? 0) + t.count);
        }
        return Array.from(merged.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
      });
      setEditing(null);
    } catch {
      setActionError("Network error while renaming.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(name: string) {
    if (confirmDelete !== name) {
      setConfirmDelete(name);
      setActionError(null);
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Could not delete that tag.");
        setConfirmDelete(null);
        return;
      }
      setTags((prev) => (prev ? prev.filter((t) => t.name !== name) : prev));
    } catch {
      setActionError("Network error while deleting.");
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  if (!tags) {
    return <p className="text-sm text-ink-soft">Loading tags…</p>;
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No tags yet — add tags to a transaction (in Manual entry, or when reviewing a scan/recording) and they&apos;ll
        show up here.
      </p>
    );
  }

  return (
    <div>
      {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {tags.map((tag, i) => (
          <div
            key={tag.name}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i === tags.length - 1 ? "" : "border-b border-line"
            }`}
          >
            {editing === tag.name ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(tag.name);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-full border border-line bg-bg-soft px-3 py-1.5 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveRename(tag.name)}
                    disabled={busy}
                    className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-foreground">{tag.name}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {tag.count} transaction{tag.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(tag)}
                    aria-label={`Rename ${tag.name}`}
                    className="rounded-full p-2 text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.848.503l-3.03.86a.5.5 0 0 1-.618-.618l.86-3.03a2 2 0 0 1 .503-.848l8.5-8.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tag.name)}
                    disabled={busy}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      confirmDelete === tag.name
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    }`}
                  >
                    {confirmDelete === tag.name ? "Confirm" : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
