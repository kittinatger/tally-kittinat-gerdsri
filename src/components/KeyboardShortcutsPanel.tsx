"use client";

import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-line bg-bg-soft px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function Row({ keys, labelKey }: { keys: React.ReactNode[]; labelKey: MessageKey }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <p className="text-sm text-foreground">{t(labelKey)}</p>
      <div className="flex shrink-0 items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs text-ink-soft">{t("keyboardShortcuts.then")}</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

// Purely informational — the shortcuts themselves live in
// KeyboardShortcuts.tsx (global chords) and CommandPalette.tsx (Ctrl/Cmd+K),
// both desktop-only, hence the footer note below.
export default function KeyboardShortcutsPanel() {
  const t = useT();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-2xl text-foreground">{t("keyboardShortcuts.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{t("keyboardShortcuts.groupGeneral")}</h4>
        <div className="divide-y divide-line">
          <Row keys={[modKey, "K"]} labelKey="keyboardShortcuts.commandPalette" />
          <Row keys={["C"]} labelKey="keyboardShortcuts.addTransaction" />
          <Row keys={["?"]} labelKey="keyboardShortcuts.showShortcuts" />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{t("keyboardShortcuts.groupNavigation")}</h4>
        <div className="divide-y divide-line">
          <Row keys={["G", "A"]} labelKey="keyboardShortcuts.goActivities" />
          <Row keys={["G", "N"]} labelKey="keyboardShortcuts.goAnalytics" />
          <Row keys={["G", "W"]} labelKey="keyboardShortcuts.goWallet" />
          <Row keys={["G", "S"]} labelKey="keyboardShortcuts.goSettings" />
        </div>
      </section>

      <p className="text-sm text-ink-soft">{t("keyboardShortcuts.desktopOnly")}</p>
    </div>
  );
}
