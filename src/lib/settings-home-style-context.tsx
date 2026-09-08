"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS_HOME_STYLE, isSettingsHomeStyleId, type SettingsHomeStyleId } from "@/lib/settings-home-styles";

const SettingsHomeStyleContext = createContext<SettingsHomeStyleId>(DEFAULT_SETTINGS_HOME_STYLE);

// Mounted once, app-wide, in the root layout — mirrors NavStyleProvider/
// LanguageProvider exactly: self-fetches the signed-in user's saved
// Settings-page-layout preference, rather than being threaded down
// through every page's server-side props, so it covers SettingsNavList
// everywhere it renders (inside SettingsView and the standalone Support
// pages) without touching each one's data fetching. On pages with no
// session the fetch just 401s and this silently stays on the default.
export function SettingsHomeStyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<SettingsHomeStyleId>(DEFAULT_SETTINGS_HOME_STYLE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.settingsHomeStyle === "string" && isSettingsHomeStyleId(data.settingsHomeStyle)) {
          setStyle(data.settingsHomeStyle);
        }
      })
      .catch(() => {
        // Not signed in, or a transient error — stay on the default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SettingsHomeStyleContext.Provider value={style}>{children}</SettingsHomeStyleContext.Provider>;
}

export function useSettingsHomeStyle(): SettingsHomeStyleId {
  return useContext(SettingsHomeStyleContext);
}
