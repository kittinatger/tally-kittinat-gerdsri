"use client";

import { useT } from "@/lib/language-context";

// One row in a "force settings" list (WalletModal's Upload-as-template
// section, TemplateEditModal) — a 3-way Auto/On/Off segmented control per
// toggle, replacing an earlier checkbox+switch combo that read as two
// separate, confusingly redundant controls for what's really one choice.
// Auto (the default, value === null) means "don't touch this toggle at
// all"; On/Off force it to that value for anyone using the template.
export default function ForceToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const t = useT();
  const options: [boolean | null, string][] = [
    [null, t("wallet.forceAuto")],
    [true, t("wallet.forceOn")],
    [false, t("wallet.forceOff")],
  ];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-foreground">{label}</span>
      <div className="flex shrink-0 gap-0.5 rounded-full bg-bg-soft p-0.5">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={String(optionValue)}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              value === optionValue ? "bg-navy text-white shadow-sm" : "text-ink-soft hover:text-foreground"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
