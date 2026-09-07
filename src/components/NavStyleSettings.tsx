"use client";

import { useEffect, useState } from "react";
import { describeFetchError } from "@/lib/fetch-error";
import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  NAV_BAR_STYLE_IDS,
  NAV_BAR_STYLES,
  DEFAULT_NAV_BAR_STYLE,
  isNavBarStyleId,
  type NavBarStyleId,
} from "@/lib/nav-bar-styles";
import { ListIcon, AnalyticsIcon, GearIcon, MembershipCardIcon, CheckIcon } from "@/lib/icons";
import BottomNavBar from "./BottomNavBar";
import ManagerHeader from "./ManagerHeader";

// Small versions of AppHeader's real bottom-nav icons/labels — the same
// four destinations, just sized for a preview thumbnail rather than the
// actual fixed-position bar.
const PREVIEW_LINKS = [
  { href: "/", label: "Activities", icon: <ListIcon className="h-3.5 w-3.5 shrink-0" /> },
  { href: "/analytics", label: "Analytics", icon: <AnalyticsIcon className="h-3.5 w-3.5 shrink-0" /> },
  { href: "/wallet", label: "Wallet", icon: <MembershipCardIcon className="h-3.5 w-3.5 shrink-0" /> },
  { href: "/settings", label: "Settings", icon: <GearIcon className="h-3.5 w-3.5 shrink-0" /> },
];

export default function NavStyleSettings() {
  const t = useT();
  const [selected, setSelected] = useState<NavBarStyleId>(DEFAULT_NAV_BAR_STYLE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.navStyle === "string" && isNavBarStyleId(data.navStyle)) {
          setSelected(data.navStyle);
        }
      })
      .catch(() => {
        // Keep the default; the user can still pick and save.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(id: NavBarStyleId) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navStyle: id }),
      });
      if (!res.ok) {
        setSelected(previous);
        setError("Could not save.");
      }
    } catch (err) {
      setSelected(previous);
      setError(describeFetchError(err));
    }
  }

  return (
    <div>
      <ManagerHeader title={t("settings.navStyle")} />
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 animate-[fade-in_0.15s_ease-out] motion-reduce:animate-none">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_BAR_STYLE_IDS.map((id) => {
          const active = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={`overflow-hidden rounded-card border p-3 text-left transition ${
                active ? "border-navy ring-2 ring-navy/30" : "border-line hover:border-navy/50"
              }`}
            >
              <div className="relative flex h-14 items-center justify-center overflow-hidden rounded-xl bg-bg-soft px-2">
                <BottomNavBar config={NAV_BAR_STYLES[id]} links={PREVIEW_LINKS} pathname="" preview activeHref="/" showAdd />
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {t(`navStyle.${id}.name` as MessageKey)}
                {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-navy dark:text-blue-300" />}
              </p>
              <p className="text-[11px] leading-snug text-ink-soft">{t(`navStyle.${id}.description` as MessageKey)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
