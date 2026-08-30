import type { WalletRow, CardTemplateRow } from "@/lib/db";
import type { WalletOption } from "@/types/wallet";
import type { CardTemplateOption } from "@/types/card-template";
import { isWalletKind } from "@/lib/wallets";
import { isCardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground } from "@/lib/card-backgrounds";
import { isChipColor, DEFAULT_CHIP_COLOR } from "@/lib/chip-colors";
import { isBadgePosition, DEFAULT_BADGE_POSITION } from "@/lib/badge-position";
import { isChipPosition, DEFAULT_CHIP_POSITION } from "@/lib/chip-position";

// Every server page that lists wallets (Activities, Analytics, Settings,
// the Wallet page itself) maps the raw DB row the same way — pulled out
// here once so the four call sites can't quietly drift out of sync with
// each other, which is exactly how the payment-card-visual fields almost
// got missed in three of the four when wallets absorbed wallet_cards.
export function toWalletOption(w: WalletRow): WalletOption {
  return {
    id: w.id,
    name: w.name,
    color: w.color,
    background: parseCardBackground(w.background),
    textColor: w.text_color,
    kind: isWalletKind(w.kind) ? w.kind : "cash",
    currency: w.currency,
    isDefault: w.is_default,
    archived: w.archived,
    balance: Number(w.balance),
    isOwner: w.is_owner,
    holderName: w.holder_name,
    last4: w.last4,
    expiryMonth: w.expiry_month,
    expiryYear: w.expiry_year,
    network: w.network && isCardNetwork(w.network) ? w.network : null,
    showNetworkBadge: w.show_network_badge,
    badgePosition: isBadgePosition(w.badge_position) ? w.badge_position : DEFAULT_BADGE_POSITION,
    iconColor: w.icon_color,
    showChip: w.show_chip,
    chipColor: isChipColor(w.chip_color) ? w.chip_color : DEFAULT_CHIP_COLOR,
    chipPosition: isChipPosition(w.chip_position) ? w.chip_position : DEFAULT_CHIP_POSITION,
    notes: w.notes,
    showBalance: w.show_balance,
    showCurrency: w.show_currency,
    showCardNumber: w.show_card_number,
    showName: w.show_name,
    showHolderName: w.show_holder_name,
    showExpiry: w.show_expiry,
  };
}

export function toCardTemplateOption(t: CardTemplateRow): CardTemplateOption {
  return {
    id: t.id,
    name: t.name,
    color: t.color,
    background: parseCardBackground(t.background),
    textColor: t.text_color,
    forceShowName: t.force_show_name,
    forceShowNetworkBadge: t.force_show_network_badge,
    forceShowChip: t.force_show_chip,
    forceShowCardNumber: t.force_show_card_number,
    forceShowBalance: t.force_show_balance,
    forceShowCurrency: t.force_show_currency,
    status: t.status,
    submittedByUsername: t.submitted_by_username,
    createdAt: t.created_at,
  };
}
