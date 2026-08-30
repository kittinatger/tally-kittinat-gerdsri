import type { WalletRow, CardTemplateRow } from "@/lib/db";
import type { WalletOption } from "@/types/wallet";
import type { CardTemplateOption } from "@/types/card-template";
import { isWalletKind } from "@/lib/wallets";
import { isCardNetwork } from "@/lib/wallet-cards";
import { parseCardBackground } from "@/lib/card-backgrounds";
import { isChipColor, DEFAULT_CHIP_COLOR } from "@/lib/chip-colors";
import { isBadgePosition, DEFAULT_BADGE_POSITION } from "@/lib/badge-position";
import { isChipPosition, DEFAULT_CHIP_POSITION } from "@/lib/chip-position";
import { isNamePosition, DEFAULT_NAME_POSITION } from "@/lib/name-position";
import { isCardNumberPosition, DEFAULT_CARD_NUMBER_POSITION } from "@/lib/card-number-position";
import { isCardTemplateCategory } from "@/lib/card-template-category";

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
    namePosition: isNamePosition(w.name_position) ? w.name_position : DEFAULT_NAME_POSITION,
    cardNumberPosition: isCardNumberPosition(w.card_number_position) ? w.card_number_position : DEFAULT_CARD_NUMBER_POSITION,
    cardNumberLast4Only: w.card_number_last4_only,
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
    forceCurrency: t.force_currency,
    country: t.country,
    forceNamePosition: t.force_name_position && isNamePosition(t.force_name_position) ? t.force_name_position : null,
    lockTextColor: t.lock_text_color,
    category: t.category && isCardTemplateCategory(t.category) ? t.category : null,
    forceNetwork: t.force_network && isCardNetwork(t.force_network) ? t.force_network : null,
    forceShowHolderName: t.force_show_holder_name,
    forceShowExpiry: t.force_show_expiry,
    status: t.status,
    submittedByUsername: t.submitted_by_username,
    createdAt: t.created_at,
  };
}
