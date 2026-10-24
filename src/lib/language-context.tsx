"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import { EN_MESSAGES, RTL_LANGUAGES, type MessageKey } from "@/lib/i18n/messages";
import { LANGUAGE_LOADERS } from "@/lib/i18n/loaders";

type Dictionary = Record<MessageKey, string>;

const LANGUAGE_STORAGE_KEY = "tally-language";

const LanguageContext = createContext<{ language: string; dictionary: Dictionary | null }>({
  language: DEFAULT_LANGUAGE,
  dictionary: null,
});

function readStoredLanguage(): string | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored && isLanguageCode(stored) ? stored : null;
  } catch {
    return null;
  }
}

// Mounted once, app-wide, in the root layout — fetches the signed-in user's
// saved language preference itself (rather than being threaded down through
// every page's server-side props) so it covers every authenticated screen,
// including the standalone Support pages, without touching each one's data
// fetching. On pages with no session (login, welcome, etc.) the fetch just
// 401s and this silently stays on the default, same as any other
// fetch-your-own-data client component in this app.
//
// English is bundled; every other language's dictionary is a separate chunk
// fetched only when that language is active. The last-known language is kept
// in localStorage so that chunk starts downloading immediately on a return
// visit instead of waiting for the settings request to come back first.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredLanguage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- applying the persisted preference once on mount
    if (stored) setLanguage(stored);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.language === "string" && isLanguageCode(data.language)) {
          setLanguage(data.language);
          try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, data.language);
          } catch {
            // Storage unavailable — the preference still applies for this session.
          }
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

    const load = LANGUAGE_LOADERS[language];
    if (!load) {
      // English (or a language with no dictionary yet) falls through to EN_MESSAGES.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to the bundled dictionary when switching back to English
      setDictionary(null);
      return;
    }
    let cancelled = false;
    load()
      .then((mod) => {
        if (!cancelled) setDictionary(mod.default);
      })
      .catch(() => {
        // Chunk failed to load (offline, etc.) — keep showing English.
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return <LanguageContext.Provider value={{ language, dictionary }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): string {
  return useContext(LanguageContext).language;
}

// Falls back to English for any key not yet translated for the current
// language (or while that language's dictionary is still loading), and to the
// key itself if even English is somehow missing it — translation coverage is
// intentionally partial, see i18n/messages.ts.
export function useT(): (key: MessageKey) => string {
  const { dictionary } = useContext(LanguageContext);
  return (key: MessageKey) => dictionary?.[key] ?? EN_MESSAGES[key] ?? key;
}
