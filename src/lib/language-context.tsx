"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import { MESSAGES, RTL_LANGUAGES, type MessageKey } from "@/lib/i18n/messages";

const LanguageContext = createContext<string>(DEFAULT_LANGUAGE);

// Mounted once, app-wide, in the root layout — fetches the signed-in user's
// saved language preference itself (rather than being threaded down through
// every page's server-side props) so it covers every authenticated screen,
// including the standalone Support pages, without touching each one's data
// fetching. On pages with no session (login, welcome, etc.) the fetch just
// 401s and this silently stays on the default, same as any other
// fetch-your-own-data client component in this app.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.language === "string" && isLanguageCode(data.language)) {
          setLanguage(data.language);
        }
      })
      .catch(() => {
        // Not signed in, or a transient error — stay on the default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
  }, [language]);

  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): string {
  return useContext(LanguageContext);
}

// Falls back to English for any key not yet translated for the current
// language, and to the key itself if even English is somehow missing it —
// translation coverage is intentionally partial, see i18n/messages.ts.
export function useT(): (key: MessageKey) => string {
  const language = useLanguage();
  return (key: MessageKey) => MESSAGES[language]?.[key] ?? MESSAGES[DEFAULT_LANGUAGE][key] ?? key;
}
