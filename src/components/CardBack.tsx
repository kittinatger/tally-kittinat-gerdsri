"use client";

import { dotClasses, colorDotStyle } from "@/lib/category-styles";
import { cardForegroundFor, type CardBackground } from "@/lib/card-backgrounds";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/language-context";
import { KIND_FIELDS, type PassKind } from "@/lib/membership-templates";
import type { WalletOption } from "@/types/wallet";
import type { MembershipCard } from "@/types/membership";
import { SignatureSvg } from "./SignaturePad";

// The backs shown by FlipCard on a card's / pass's detail view. Both use
// the card's plain colour (darkened) — never the front's pattern, photo or
// gradient — so the back stays a calm, readable surface.

function Shell({
  color,
  textColor,
  className = "",
  children,
}: {
  color: string;
  /** Accepted for call-site symmetry with the front; the back ignores it. */
  background?: CardBackground | null;
  textColor: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const fg = cardForegroundFor(textColor, null, color);
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl ${dotClasses(color)} ${className}`}
      style={{ color: fg.full, ...colorDotStyle(color) }}
    >
      {/* Darken the face so it reads as the back, not a second front. */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** Back of a wallet: a magnetic stripe, signature strip, and the account's details. */
export function WalletBack({ wallet, currency, signature = null }: { wallet: WalletOption; currency: string; signature?: string | null }) {
  const t = useT();
  const expiry =
    wallet.expiryMonth && wallet.expiryYear ? `${String(wallet.expiryMonth).padStart(2, "0")}/${String(wallet.expiryYear).slice(-2)}` : null;
  return (
    <Shell color={wallet.color} background={wallet.background} textColor={wallet.textColor}>
      <div className="flex h-full flex-col">
        {/* Magnetic stripe */}
        <div className="mt-3 h-8 w-full shrink-0 bg-black/85" />
        {/* Signature strip with the last 4 digits */}
        <div className="mx-4 mt-2.5 flex h-8 shrink-0 items-center gap-3">
          <div className="relative h-full flex-1 overflow-hidden rounded-sm bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.92)_0_6px,rgba(235,235,235,0.92)_6px_12px)]">
            {signature && <SignatureSvg path={signature} className="absolute inset-0 h-full w-full px-2 py-0.5 text-neutral-900" />}
          </div>
          <span className="rounded-sm bg-white/90 px-2 py-0.5 font-mono text-xs font-semibold italic text-neutral-800">
            {wallet.last4 ?? "•••"}
          </span>
        </div>
        {/* At most four details, so they always fit the card. */}
        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-3 text-xs">
          <BackField label={t("wallet.balanceLabel")} value={formatCurrency(wallet.balance, currency)} strong />
          <BackField label={t("wallet.currencyLabel")} value={wallet.isDefault ? `${currency} · Default` : currency} />
          {wallet.holderName ? (
            <BackField label="Card holder" value={wallet.holderName} />
          ) : (
            <BackField label={t("wallet.typeLabel")} value={wallet.kind === "digital" ? t("wallet.digital") : t("wallet.cash")} />
          )}
          {expiry && <BackField label="Expires" value={expiry} />}
        </div>
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
