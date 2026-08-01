"use client";

import { useState } from "react";

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
            <svg viewBox="0 0 20.1197 19.7779" fill="currentColor" className="h-2.5 w-2.5">
              <path d="M18.1262 0.303967L0.27467 18.1555C-0.0866577 18.5169-0.0964233 19.1321 0.27467 19.5032C0.65553 19.8645 1.261 19.8645 1.63209 19.5032L19.4739 1.65162C19.845 1.2903 19.8547 0.675061 19.4739 0.303967C19.1028-0.0573608 18.4973-0.0671265 18.1262 0.303967ZM19.4739 18.1555L1.63209 0.303967C1.261-0.0573608 0.645764-0.0671265 0.27467 0.303967C-0.0866577 0.684827-0.0866577 1.2903 0.27467 1.65162L18.1262 19.5032C18.4876 19.8645 19.1126 19.8743 19.4739 19.5032C19.845 19.1223 19.845 18.5169 19.4739 18.1555Z" />
            </svg>
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
