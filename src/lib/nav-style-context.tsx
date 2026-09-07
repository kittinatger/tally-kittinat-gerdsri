"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_NAV_BAR_STYLE, isNavBarStyleId, type NavBarStyleId } from "@/lib/nav-bar-styles";

const NavStyleContext = createContext<NavBarStyleId>(DEFAULT_NAV_BAR_STYLE);

// Mounted once, app-wide, in the root layout — mirrors LanguageProvider
// exactly (same file, same reasoning): fetches the signed-in user's saved
// nav-bar-style preference itself, rather than being threaded down through
// every page's server-side props, so it covers every page AppHeader
// renders on without touching each one's data fetching. On pages with no
// session (login, welcome, etc.) the fetch just 401s and this silently
// stays on the default, same as any other fetch-your-own-data client
// component in this app.
export function NavStyleProvider({ children }: { children: React.ReactNode }) {
  const [navStyle, setNavStyle] = useState<NavBarStyleId>(DEFAULT_NAV_BAR_STYLE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.navStyle === "string" && isNavBarStyleId(data.navStyle)) {
          setNavStyle(data.navStyle);
        }
      })
      .catch(() => {
        // Not signed in, or a transient error — stay on the default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <NavStyleContext.Provider value={navStyle}>{children}</NavStyleContext.Provider>;
}

export function useNavStyle(): NavBarStyleId {
  return useContext(NavStyleContext);
}
