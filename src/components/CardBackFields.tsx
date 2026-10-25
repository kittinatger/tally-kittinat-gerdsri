"use client";

import { PenNibIcon } from "@phosphor-icons/react/dist/ssr";
import CardBackgroundPicker from "./CardBackgroundPicker";
import CardTextColorPicker from "./CardTextColorPicker";
import { SignatureSvg } from "./SignaturePad";
import { DEFAULT_BACK_DESIGN, type CardBackDesign } from "@/lib/card-back";
import { cardForegroundFor } from "@/lib/card-backgrounds";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-navy" : "bg-bg-soft"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

const PARTS: { key: "showStripe" | "showSignature" | "showBalance" | "showCurrency" | "showHolder" | "showExpiry"; label: string; hint: string }[] = [
  { key: "showStripe", label: "Magnetic stripe", hint: "The black band across the top." },
  { key: "showSignature", label: "Signature strip", hint: "Your signature and the last 4 digits." },
  { key: "showBalance", label: "Balance", hint: "Current balance of the account." },
  { key: "showCurrency", label: "Currency", hint: "The account's currency." },
  { key: "showHolder", label: "Card holder", hint: "Name on the card (or the account type)." },
  { key: "showExpiry", label: "Expiry date", hint: "When the card expires, if set." },
];

// The "Back" tab of the wallet form: whether the back follows the front or
// has its own colour / pattern / photo, the text colour, which parts of the
// back show, and this card's signature. The wallet form's own preview shows
// the back while this tab is open.
export default function CardBackFields({
  design,
  onChange,
  frontColor,
  signature,
  signatureIsOwn,
  onEditSignature,
  signatureNote,
}: {
  design: CardBackDesign;
  onChange: (patch: Partial<CardBackDesign>) => void;
  /** The card's own colour, used as the starting colour when switching to a custom back. */
  frontColor: string;
  /** The signature currently shown on the back (this card's, or the default). */
  signature: string | null;
  signatureIsOwn: boolean;
  /** Opens the signing pad; omitted until the card exists (add mode). */
  onEditSignature?: () => void;
  signatureNote?: string;
}) {
  function setCustom(custom: boolean) {
    onChange({
      custom,
      ...(custom && !design.custom && !design.background && design.color === DEFAULT_BACK_DESIGN.color ? { color: frontColor } : {}),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Match the front</p>
            <p className="text-xs text-ink-soft">The back follows the front&apos;s colour automatically.</p>
          </div>
          <Toggle checked={!design.custom} onChange={(auto) => setCustom(!auto)} label="Match the front" />
        </div>

        {design.custom && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <CardBackgroundPicker
              value={design.background}
              onChange={(background) => onChange({ background })}
              plainColor={design.color}
              onPlainColorChange={(color) => onChange({ color })}
            />
            <div className="border-t border-line pt-3">
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Text colour</label>
              <CardTextColorPicker
                value={design.textColor}
                onChange={(textColor) => onChange({ textColor })}
                autoColor={cardForegroundFor(null, design.background, design.color).full}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-card border border-line bg-surface p-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy dark:text-blue-300">
            <PenNibIcon weight="fill" aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Signature</p>
            <p className="text-xs text-ink-soft">
              {signatureNote ?? (signatureIsOwn ? "This card's own signature." : signature ? "Using your default signature." : "No signature yet.")}
            </p>
          </div>
        </div>
        {signature && (
          <div className="mt-3 rounded-xl border border-line bg-white px-4 py-2 text-neutral-900">
            <SignatureSvg path={signature} className="h-14 w-full" />
          </div>
        )}
        {onEditSignature && (
          <button
            type="button"
            onClick={onEditSignature}
            className="mt-3 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-navy"
          >
            {signatureIsOwn ? "Change signature" : "Sign this card"}
          </button>
        )}
      </div>

      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        {PARTS.map((part) => (
          <div key={part.key} className="flex items-center justify-between gap-3 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{part.label}</p>
              <p className="text-xs text-ink-soft">{part.hint}</p>
            </div>
            <Toggle checked={design[part.key]} onChange={(v) => onChange({ [part.key]: v } as Partial<CardBackDesign>)} label={part.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
