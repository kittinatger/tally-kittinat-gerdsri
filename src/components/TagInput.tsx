"use client";

import { useState } from "react";
import { CloseIcon } from "@/lib/icons";

const MAX_TAGS = 10;

export default function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const value = raw.trim();
    if (!value || tags.length >= MAX_TAGS) {
      setDraft("");
      return;
    }
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-surface-line bg-surface-soft px-2.5 py-2 focus-within:border-surface-accent focus-within:ring-2 focus-within:ring-surface-accent/20">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-[var(--surface-nav-hover)] px-2.5 py-1 text-xs font-semibold text-surface-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
            className="text-surface-foreground-soft transition hover:text-surface-foreground"
          >
            <CloseIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={tags.length === 0 ? "Add tags (press Enter)..." : tags.length < MAX_TAGS ? "Add another..." : ""}
        disabled={tags.length >= MAX_TAGS}
        className="min-w-[110px] flex-1 border-none bg-transparent text-sm text-surface-foreground outline-none placeholder:text-surface-foreground-soft disabled:cursor-not-allowed"
      />
    </div>
  );
}
