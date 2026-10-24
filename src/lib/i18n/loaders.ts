import type { MessageKey } from "./messages";

type Dictionary = Record<MessageKey, string>;

// One lazy import per non-English language, so a user only ever downloads the
// dictionary for the language they actually use.
export const LANGUAGE_LOADERS: Record<string, () => Promise<{ default: Dictionary }>> = {
  zh: () => import("./lang/zh"),
  hi: () => import("./lang/hi"),
  es: () => import("./lang/es"),
  fr: () => import("./lang/fr"),
  ar: () => import("./lang/ar"),
  bn: () => import("./lang/bn"),
  pt: () => import("./lang/pt"),
  ru: () => import("./lang/ru"),
  ur: () => import("./lang/ur"),
  id: () => import("./lang/id"),
  de: () => import("./lang/de"),
  ja: () => import("./lang/ja"),
  vi: () => import("./lang/vi"),
  tr: () => import("./lang/tr"),
  th: () => import("./lang/th"),
};
