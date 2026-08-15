"use client";

import { useT } from "@/lib/language-context";
import type { MessageKey } from "@/lib/i18n/messages";

/** Renders a single translated string inside a server component. */
export default function T({ k }: { k: MessageKey }) {
  const t = useT();
  return <>{t(k)}</>;
}
