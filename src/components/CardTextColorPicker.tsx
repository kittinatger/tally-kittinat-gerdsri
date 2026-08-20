"use client";

import ColorPicker from "./ColorPicker";
import { useT } from "@/lib/language-context";

// White/black quick-picks alongside the full custom picker — covers the
// two contrast directions a manual override is usually reaching for.
const QUICK_COLORS = ["#ffffff", "#0f172a"] as const;

// Lets a user override the card's auto-contrast text color (see
// cardForegroundFor in card-backgrounds.ts) with a specific one. `value:
// null` means "auto" is active — the caller already computes what that
// resolves to (`autoColor`) so its swatch can show the real color instead
// of a placeholder.
export default function CardTextColorPicker({
  value,
  onChange,
  autoColor,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  autoColor: string;
}) {
  const t = useT();
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-label={t("background.textColorAuto")}
        className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
          value === null ? "border-navy bg-navy/10 text-navy dark:text-blue-300" : "border-line text-ink-soft hover:bg-[var(--nav-hover-bg)]"
        }`}
      >
        <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ backgroundColor: autoColor }} />
        {t("background.textColorAuto")}
      </button>
      <ColorPicker value={value ?? autoColor} onChange={onChange} palette={QUICK_COLORS} />
    </div>
  );
}
