"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useT } from "@/lib/language-context";
import { useMediaQuery, DESKTOP_QUERY } from "@/lib/use-media-query";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav-data";
import { SearchIcon, ListIcon, AnalyticsIcon, MembershipCardIcon, GearIcon, PlusIcon } from "@/lib/icons";
import type { MessageKey } from "@/lib/i18n/messages";

type Command = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onSelect: (router: ReturnType<typeof useRouter>) => void;
};

// Desktop-only global Ctrl/Cmd+K palette. Mounted once in RootLayout — see
// use-media-query.ts's own doc comment for why this needs useMediaQuery
// (which whole component mounts) rather than a Tailwind class (this one
// attaches/detaches a global keydown listener, which isn't something CSS
// can gate).
export default function CommandPalette() {
  const t = useT();
  const router = useRouter();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = [
      { id: "nav-activities", label: t("nav.activities"), icon: <ListIcon className="h-4 w-4" />, onSelect: (r) => r.push("/") },
      { id: "nav-analytics", label: t("nav.analytics"), icon: <AnalyticsIcon className="h-4 w-4" />, onSelect: (r) => r.push("/analytics") },
      { id: "nav-wallet", label: t("nav.wallet"), icon: <MembershipCardIcon className="h-4 w-4" />, onSelect: (r) => r.push("/wallet") },
      { id: "nav-settings", label: t("nav.settings"), icon: <GearIcon className="h-4 w-4" />, onSelect: (r) => r.push("/settings") },
    ];
    const add: Command[] = (["expense", "income", "transfer"] as const).map((kind) => ({
      id: `add-${kind}`,
      label: `${t("nav.add")} ${t(`common.${kind}` as MessageKey)}`,
      icon: <PlusIcon className="h-4 w-4" />,
      onSelect: (r) => r.push(`/?add=${kind}`),
    }));
    // Every non-special settings row, admin sections excluded entirely —
    // this globally-mounted component has no cheap way to know if the
    // current user is the admin, so admin panels stay reachable only
    // through Settings itself. See the plan doc for this call.
    const settings: Command[] = SETTINGS_SECTIONS.filter((s) => !s.adminOnly).flatMap((section) =>
      section.rows
        .filter((row) => row.kind !== "special")
        .map((row) => {
          if (row.kind === "panel") {
            return {
              id: `settings-${row.panel}`,
              label: t(row.labelKey),
              icon: row.icon,
              onSelect: (r: ReturnType<typeof useRouter>) => r.push(`/settings?panel=${row.panel}`),
            };
          }
          return {
            id: `settings-${row.href}`,
            label: t(row.labelKey),
            icon: row.icon,
            onSelect: (r: ReturnType<typeof useRouter>) => r.push(row.href),
          };
        }),
    );
    return [...nav, ...add, ...settings];
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (!isDesktop) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) {
            setQuery("");
            setSelected(0);
          }
          return next;
        });
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDesktop]);

  // Autofocus needs a tick since the input just mounted — a ref callback
  // (not an effect) so there's no setState involved at all.
  function focusInputOnMount(el: HTMLInputElement | null) {
    if (el) setTimeout(() => el.focus(), 0);
  }

  // Clamped inline instead of an effect that resets it on every query
  // change — one fewer render pass, and it's simple arithmetic, not a
  // synchronization concern.
  const clampedSelected = Math.min(selected, Math.max(0, filtered.length - 1));

  function activate(cmd: Command) {
    cmd.onSelect(router);
    setOpen(false);
  }

  if (!isDesktop || !open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[15vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[image:var(--modal-glass-bg)] shadow-soft"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected(Math.min(clampedSelected + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected(Math.max(clampedSelected - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const cmd = filtered[clampedSelected];
            if (cmd) activate(cmd);
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            ref={focusInputOnMount}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("commandPalette.placeholder")}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-ink-soft"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-soft">{t("commandPalette.noResults")}</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => activate(cmd)}
                onMouseEnter={() => setSelected(i)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                  i === clampedSelected ? "bg-navy text-white" : "text-foreground hover:bg-bg-soft"
                }`}
              >
                <span className={i === clampedSelected ? "text-white" : "text-ink-soft"}>{cmd.icon}</span>
                {cmd.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
