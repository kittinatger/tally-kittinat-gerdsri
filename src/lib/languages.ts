export type LanguageOption = {
  /** BCP-47 language code. */
  code: string;
  /** English name, shown as a secondary label. */
  name: string;
  /** Name in the language itself — the primary label in the picker. */
  nativeName: string;
};

// Starting set: the world's most-spoken languages by total speakers
// (native + second-language, per Ethnologue), plus Thai. More languages can
// be appended here as translations for them are added — this list and the
// UI's actual translated strings are maintained separately, so adding a
// language here makes it selectable before every string is translated.
export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "zh", name: "Chinese (Mandarin)", nativeName: "中文" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
];

export const DEFAULT_LANGUAGE = "en";

const LANGUAGE_CODES = new Set(LANGUAGES.map((l) => l.code));

export function isLanguageCode(value: string): boolean {
  return LANGUAGE_CODES.has(value);
}

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeName ?? code;
}
