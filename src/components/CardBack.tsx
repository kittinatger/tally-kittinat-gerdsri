"use client";

import { useEffect, useState } from "react";
import { dotClasses, colorDotStyle } from "@/lib/category-styles";
import { cardBackgroundStyle, cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import type { CardBackDesign } from "@/lib/card-back";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";
import { KIND_FIELDS, type PassKind } from "@/lib/membership-templates";
import type { WalletOption } from "@/types/wallet";
import type { MembershipCard } from "@/types/membership";
import { SignatureSvg } from "./SignaturePad";

// The backs shown by FlipCard on a card's / pass's detail view. Both are a
// plain colour (darkened) — never the front's pattern, photo or gradient — so
// the back stays a calm, readable surface, but the colour is the one the
// FRONT actually shows: a pattern's base colour, or the average colour of a
// photo front. (The card's own `color` field is only a fallback — it's a
// leftover default, e.g. green, on a card whose front is a black photo.)

const DARK_NEUTRAL = "#1f2937";

// The average colour of a photo (data URL), sampled on a tiny canvas.
function useAverageColor(photoDataUrl: string | null): string | null {
  const [sampled, setSampled] = useState<{ url: string; color: string } | null>(null);
  useEffect(() => {
    if (!photoDataUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0;
        const n = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
        setSampled({ url: photoDataUrl, color: `#${hex(r)}${hex(g)}${hex(b)}` });
      } catch {
        // Unreadable image — keep the neutral fallback.
      }
    };
    img.src = photoDataUrl;
    return () => {
      cancelled = true;
    };
  }, [photoDataUrl]);
  return sampled && sampled.url === photoDataUrl ? sampled.color : null;
}

/** The back's base colour: a hex string, or the card's palette token when the front is plain.
 * `skip` drops the photo sampling entirely — used when a custom back design
 * already has its own colour and this auto one would just be thrown away;
 * decoding the front's photo onto a canvas on every mount only to discard
 * it was a real, avoidable cost on the now-common "custom back" path. */
function useBackColor(color: string, background: CardBackground | null | undefined, skip: boolean): string {
  const photo = !skip && background && background.pattern === "photo" ? background.photoDataUrl : null;
  const average = useAverageColor(photo);
  if (!background) return color;
  if (background.pattern === "photo") return average ?? DARK_NEUTRAL;
  return background.colors[0] ?? color;
}

function Shell({
  color,
  background,
  textColor,
  design,
  className = "",
  children,
}: {
  color: string;
  /** The front's background — only used to pick the back's colour. */
  background?: CardBackground | null;
  /** The card's own back design; when `custom`, it replaces the automatic colour. */
  design?: CardBackDesign;
  textColor: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const custom = Boolean(design?.custom);
  const auto = useBackColor(color, background, custom);
  if (custom && design) {
    // The user's own back: their colour, pattern or photo, untouched.
    const bg = design.background;
    const fg = cardForegroundFor(design.textColor, bg, design.color);
    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded-2xl ${bg ? "" : dotClasses(design.color)} ${className}`}
        style={{ color: fg.full, ...(bg ? cardBackgroundStyle(bg) : colorDotStyle(design.color)) }}
      >
        <div className="relative h-full">{children}</div>
      </div>
    );
  }
  const fg = cardForegroundFor(textColor, null, auto);
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl ${dotClasses(auto)} ${className}`}
      style={{ color: fg.full, ...colorDotStyle(auto) }}
    >
      {/* Darken the face so it reads as the back, not a second front. */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** Back of a wallet: a magnetic stripe, signature strip, and the account's details — each can be switched off in the card's back design. */
export function WalletBack({
  wallet,
  currency,
  signature = null,
  design,
}: {
  wallet: WalletOption;
  currency: string;
  signature?: string | null;
  /** Overrides wallet.backDesign — used by the live preview while editing. */
  design?: CardBackDesign;
}) {
  const t = useT();
  const d = design ?? wallet.backDesign;
  const expiry =
    wallet.expiryMonth && wallet.expiryYear ? `${String(wallet.expiryMonth).padStart(2, "0")}/${String(wallet.expiryYear).slice(-2)}` : null;
  const details = [
    d.showBalance && <BackField key="balance" label={t("wallet.balanceLabel")} value={formatCurrency(wallet.balance, currency)} strong />,
    d.showCurrency && <BackField key="currency" label={t("wallet.currencyLabel")} value={wallet.isDefault ? `${currency} · Default` : currency} />,
    d.showHolder &&
      (wallet.holderName ? (
        <BackField key="holder" label="Card holder" value={wallet.holderName} />
      ) : (
        <BackField key="type" label={t("wallet.typeLabel")} value={wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")} />
      )),
    d.showExpiry && expiry && <BackField key="expiry" label="Expires" value={expiry} />,
  ].filter(Boolean);
  return (
    <Shell color={wallet.color} background={wallet.background} textColor={wallet.textColor} design={d}>
      <div className="flex h-full flex-col">
        {/* Magnetic stripe */}
        {d.showStripe && <div className="mt-3 h-8 w-full shrink-0 bg-black/85" />}
        {/* Signature strip with the last 4 digits */}
        {d.showSignature && (
          <div className={`mx-4 flex h-8 shrink-0 items-center gap-3 ${d.showStripe ? "mt-2.5" : "mt-4"}`}>
            <div className="relative h-full flex-1 overflow-hidden rounded-sm bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.92)_0_6px,rgba(235,235,235,0.92)_6px_12px)]">
              {signature && <SignatureSvg path={signature} className="absolute inset-0 h-full w-full px-2 py-0.5 text-neutral-900" />}
            </div>
            <span className="rounded-sm bg-white/90 px-2 py-0.5 font-mono text-xs font-semibold italic text-neutral-800">
              {wallet.last4 ?? "•••"}
            </span>
          </div>
        )}
        {/* At most four details, so they always fit the card. */}
        {details.length > 0 && <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-3 pt-2 text-xs">{details}</div>}
      </div>
    </Shell>
  );
}

/** Back of a pass: every filled-in field, the code number and notes. */
export function PassBack({ card }: { card: MembershipCard }) {
  const t = useT();
  const defs = Object.fromEntries((KIND_FIELDS[card.kind as PassKind] ?? []).map((f) => [f.key, f]));
  const fields = Object.entries(card.fields)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, label: defs[key] ? t(defs[key].labelKey) : (card.customFieldLabels[key] ?? key), value }));

  return (
    <Shell color={card.color} background={card.background} textColor={card.textColor}>
      <div className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide opacity-80">{card.name}</p>
          <p className="max-w-[55%] truncate font-mono text-xs font-semibold opacity-90" title={card.codeValue}>
            {card.codeValue}
          </p>
        </div>
        {fields.length > 0 && (
          <div className="mt-3 grid min-h-0 grid-cols-2 gap-x-4 gap-y-2 overflow-hidden text-xs">
            {fields.slice(0, 6).map((f) => (
              <BackField key={f.key} label={f.label} value={f.value} />
            ))}
          </div>
        )}
        {card.notes && <p className="mt-auto line-clamp-2 whitespace-pre-wrap pt-2 text-xs leading-snug opacity-90">{card.notes}</p>}
      </div>
    </Shell>
  );
}

function BackField({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className={`truncate ${strong ? "text-sm font-bold" : "font-medium"}`}>{value}</p>
    </div>
  );
}
