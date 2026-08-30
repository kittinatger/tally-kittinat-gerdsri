"use client";

// One row in a "force settings" list (WalletModal's Upload-as-template
// section, TemplateEditModal) — a checkbox to opt this toggle into being
// forced at all (value stays null, "don't touch it", until checked), and
// once checked, a real on/off switch to pick which way it's forced. This
// used to just capture whatever the surrounding form's live toggle
// happened to be set to when the checkbox was ticked — this decouples
// "forced or not" from "forced to what", so a template can force a
// setting to a value different from whatever's currently showing in the
// preview above it.
export default function ForceToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const forced = value !== null;
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={forced}
          onChange={(e) => onChange(e.target.checked ? true : null)}
          className="h-4 w-4 shrink-0 rounded border-line accent-navy"
        />
        {label}
      </label>
      {forced && (
        <button
          type="button"
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value ?? false}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${value ? "bg-navy" : "bg-line"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${value ? "translate-x-4.5" : "translate-x-0.5"}`}
          />
        </button>
      )}
    </div>
  );
}
